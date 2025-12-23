import { Request, Response } from 'express';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import Team from '../models/Team';
import { AuthRequest } from '../middleware/authMiddleware';

export const getDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access denied: Admins only' });
      return;
    }

    const timeframe = (req.query.timeframe as string) || 'month';
    const { startDate, endDate } = calculateDateRange(timeframe);

    const [userStats, projectStats, taskStats, teamCount, avgProjectDuration] = await Promise.all([
      User.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            newInPeriod: [
              { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
              { $count: 'count' },
            ],
            byRole: [{ $group: { _id: '$role', count: { $sum: 1 } } }],
          },
        },
      ]),
      Project.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            newInPeriod: [
              { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
              { $count: 'count' },
            ],
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
            overdue: [
              { $match: { endDate: { $lt: new Date() }, status: { $ne: 'completed' } } },
              { $count: 'count' },
            ],
          },
        },
      ]),
      Task.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            newInPeriod: [
              { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
              { $count: 'count' },
            ],
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
            completed: [{ $match: { status: 'done' } }, { $count: 'count' }],
            overdue: [
              { $match: { dueDate: { $lt: new Date() }, status: { $ne: 'done' } } },
              { $count: 'count' },
            ],
            unassigned: [
              { $match: { $expr: { $eq: [{ $size: '$assignee' }, 0] } } },
              { $count: 'count' },
            ],
          },
        },
      ]),
      Team.countDocuments(),

      calculateAverageProjectDuration(),
    ]);

    const users = userStats[0] || {};
    const projects = projectStats[0] || {};
    const tasks = taskStats[0] || {};

    const totalUsers = users.total[0]?.count || 0;
    const newUsers = users.newInPeriod[0]?.count || 0;

    const totalProjects = projects.total[0]?.count || 0;
    const newProjects = projects.newInPeriod[0]?.count || 0;
    const completedProjects = projects.completed[0]?.count || 0;
    const overdueProjects = projects.overdue[0]?.count || 0;
    const projectCompletionRate =
      totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    const totalTasks = tasks.total[0]?.count || 0;
    const newTasks = tasks.newInPeriod[0]?.count || 0;
    const completedTasks = tasks.completed[0]?.count || 0;
    const overdueTasks = tasks.overdue[0]?.count || 0;
    const unassignedTasks = tasks.unassigned[0]?.count || 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const lastPeriod = calculateDateRange(timeframe, true);
    const lastNewUsers = await User.countDocuments({
      createdAt: { $gte: lastPeriod.startDate, $lte: lastPeriod.endDate },
    });
    const userGrowthRate =
      lastNewUsers > 0
        ? Math.round(((newUsers - lastNewUsers) / lastNewUsers) * 100)
        : newUsers > 0
        ? 100
        : 0;

    const dashboardData = {
      timeframe,
      kpis: {
        totalUsers,
        totalProjects,
        totalTasks,
        completedTasks,
        totalTeams: teamCount,
        overdueTasks,
        overdueProjects,
        unassignedTasks,
      },
      userAnalytics: {
        newUsers,
        userGrowthRate,
        usersByRole: {
          admin:
            (users.byRole || []).find((r: { _id: string; count: number }) => r._id === 'admin')
              ?.count || 0,
          manager:
            (users.byRole || []).find((r: { _id: string; count: number }) => r._id === 'manager')
              ?.count || 0,
          user:
            (users.byRole || []).find((r: { _id: string; count: number }) => r._id === 'user')
              ?.count || 0,
        },
      },
      projectAnalytics: {
        newProjects,
        projectsByStatus: {
          planning:
            (projects.byStatus || []).find(
              (p: { _id: string; count: number }) => p._id === 'planning'
            )?.count || 0,
          inProgress:
            (projects.byStatus || []).find(
              (p: { _id: string; count: number }) => p._id === 'inProgress'
            )?.count || 0,
          completed:
            (projects.byStatus || []).find(
              (p: { _id: string; count: number }) => p._id === 'completed'
            )?.count || 0,
          onHold:
            (projects.byStatus || []).find(
              (p: { _id: string; count: number }) => p._id === 'onHold'
            )?.count || 0,
        },
        completionRate: projectCompletionRate,
        avgProjectDuration,
        overdueProjects,
      },
      taskAnalytics: {
        newTasks,
        tasksByStatus: {
          todo:
            (tasks.byStatus || []).find((t: { _id: string; count: number }) => t._id === 'todo')
              ?.count || 0,
          inProgress:
            (tasks.byStatus || []).find(
              (t: { _id: string; count: number }) => t._id === 'inProgress'
            )?.count || 0,
          review:
            (tasks.byStatus || []).find((t: { _id: string; count: number }) => t._id === 'review')
              ?.count || 0,
          done:
            (tasks.byStatus || []).find((t: { _id: string; count: number }) => t._id === 'done')
              ?.count || 0,
        },
        tasksByPriority: {
          low:
            (tasks.byPriority || []).find((t: { _id: string; count: number }) => t._id === 'low')
              ?.count || 0,
          medium:
            (tasks.byPriority || []).find((t: { _id: string; count: number }) => t._id === 'medium')
              ?.count || 0,
          high:
            (tasks.byPriority || []).find((t: { _id: string; count: number }) => t._id === 'high')
              ?.count || 0,
          critical:
            (tasks.byPriority || []).find(
              (t: { _id: string; count: number }) => t._id === 'critical'
            )?.count || 0,
        },
        completionRate: taskCompletionRate,
        overdueTasks,
        unassignedTasks,
        avgTasksPerUser: totalUsers > 0 ? Math.round(totalTasks / totalUsers) : 0,
      },
    };

    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
};

function calculateDateRange(
  timeframe: string,
  lastPeriod = false
): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date();

  let year = now.getFullYear();
  let month = now.getMonth();
  if (lastPeriod) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }

  switch (timeframe) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
      break;
    case 'quarter':
      startDate = new Date(year, month - 3, 1);
      break;
    case 'year':
      startDate = new Date(year, 0, 1);
      break;
    default:
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
  }

  return { startDate, endDate };
}

async function calculateAverageProjectDuration() {
  const result = await Project.aggregate([
    {
      $match: {
        status: 'completed',
        startDate: { $exists: true },
        endDate: { $exists: true },
      },
    },
    {
      $project: {
        durationInDays: {
          $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$durationInDays' },
      },
    },
  ]);

  return result.length > 0 ? Math.round(result[0].avgDuration) : 0;
}
