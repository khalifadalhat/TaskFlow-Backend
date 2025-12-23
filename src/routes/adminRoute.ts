import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getDashboardOverview } from '../controllers/adminController';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard analytics and KPIs
 */

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get comprehensive dashboard overview (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: month
 *         description: Time period for time-bound metrics (e.g., new users, new projects)
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     timeframe:
 *                       type: string
 *                       example: month
 *                     kpis:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalProjects:
 *                           type: integer
 *                         totalTasks:
 *                           type: integer
 *                         completedTasks:
 *                           type: integer
 *                         totalTeams:
 *                           type: integer
 *                         overdueTasks:
 *                           type: integer
 *                         overdueProjects:
 *                           type: integer
 *                         unassignedTasks:
 *                           type: integer
 *                     userAnalytics:
 *                       type: object
 *                       properties:
 *                         newUsers:
 *                           type: integer
 *                         userGrowthRate:
 *                           type: integer
 *                           description: Percentage growth compared to previous period
 *                         usersByRole:
 *                           type: object
 *                           properties:
 *                             admin:
 *                               type: integer
 *                             manager:
 *                               type: integer
 *                             user:
 *                               type: integer
 *                     projectAnalytics:
 *                       type: object
 *                       properties:
 *                         newProjects:
 *                           type: integer
 *                         projectsByStatus:
 *                           type: object
 *                           properties:
 *                             planning:
 *                               type: integer
 *                             inProgress:
 *                               type: integer
 *                             completed:
 *                               type: integer
 *                             onHold:
 *                               type: integer
 *                         completionRate:
 *                           type: integer
 *                           description: Percentage of completed projects
 *                         avgProjectDuration:
 *                           type: integer
 *                           description: Average duration in days for completed projects
 *                         overdueProjects:
 *                           type: integer
 *                     taskAnalytics:
 *                       type: object
 *                       properties:
 *                         newTasks:
 *                           type: integer
 *                         tasksByStatus:
 *                           type: object
 *                           properties:
 *                             todo:
 *                               type: integer
 *                             inProgress:
 *                               type: integer
 *                             review:
 *                               type: integer
 *                             done:
 *                               type: integer
 *                         tasksByPriority:
 *                           type: object
 *                           properties:
 *                             low:
 *                               type: integer
 *                             medium:
 *                               type: integer
 *                             high:
 *                               type: integer
 *                             critical:
 *                               type: integer
 *                         completionRate:
 *                           type: integer
 *                           description: Percentage of completed tasks
 *                         overdueTasks:
 *                           type: integer
 *                         unassignedTasks:
 *                           type: integer
 *                         avgTasksPerUser:
 *                           type: number
 *                           description: Average tasks per user (rounded)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access denied. Requires one of the following roles: admin"
 *       500:
 *         description: Server error
 */
router.get('/overview', authorize('admin'), getDashboardOverview);

export default router;
