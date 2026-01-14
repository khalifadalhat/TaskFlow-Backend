import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Task from '../models/Task';
import Project from '../models/Project';

export const getMemberDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const today = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);

    const stats = await Task.aggregate([
      { $match: { assignee: userId } },
      {
        $facet: {
          totalTasks: [{ $count: 'count' }],
          completedTasks: [{ $match: { status: 'done' } }, { $count: 'count' }],
          overdueTasks: [
            {
              $match: {
                status: { $ne: 'done' },
                dueDate: { $lt: today },
              },
            },
            { $count: 'count' },
          ],
          tasksDueThisWeek: [
            {
              $match: {
                dueDate: { $gte: today, $lte: endOfWeek },
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const activeProjectsCount = await Project.countDocuments({
      $or: [
        { manager: userId },
        // { members: userId }
      ],
      status: 'in_progress',
    });

    const s = stats[0];
    const total = s.totalTasks[0]?.count || 0;
    const completed = s.completedTasks[0]?.count || 0;

    const data = {
      myProjects: activeProjectsCount,
      activeProjects: activeProjectsCount,
      myTasks: total,
      completedTasks: completed,
      overdueTasks: s.overdueTasks[0]?.count || 0,
      tasksDueThisWeek: s.tasksDueThisWeek[0]?.count || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve member metrics' });
  }
};
