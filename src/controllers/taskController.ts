import { Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/authMiddleware';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    let filter: any = {};

    if (req.user?.role === 'manager') {
      const projects = await Project.find({ manager: req.user.id }).select('_id');
      filter.project = { $in: projects.map(p => p._id) };
    }

    if (req.user?.role === 'user') {
      filter.assignee = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'firstName lastName')
      .populate('assigner', 'firstName lastName')
      .populate('project', 'projectName');

    res.status(200).json(tasks);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tasks' });
    return;
  }
};

export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'firstName lastName')
      .populate('assigner', 'firstName lastName')
      .populate('project', 'projectName manager');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { role, id } = req.user;

    if (role === 'user' && !task.assignee.some(assigneeId => assigneeId.toString() === id)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (role === 'manager' && (task.project as any).manager.toString() !== id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json(task);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve task' });
    return;
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'user') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const { title, description, priority, assignee, project, estimatedHours, dueDate } = req.body;

    if (!title || !description || !project || !assignee?.length) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (req.user.role === 'manager' && projectExists.manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const task = await Task.create({
      title,
      description,
      priority,
      assignee,
      project,
      estimatedHours,
      dueDate,
      assigner: req.user.id,
    });

    res.status(201).json(task);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task' });
    return;
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (req.user?.role === 'user') {
      const isAssignee = task.assignee.some(id => id.toString() === req.user!.id);

      if (!isAssignee) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      const allowedUserUpdates = ['status', 'timeSpent'];
      allowedUserUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          (task as any)[field] = req.body[field];
        }
      });

      await task.save();
      res.status(200).json(task);
      return;
    }

    if (req.user?.role === 'manager' && (task.project as any).manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const allowedUpdates = [
      'title',
      'description',
      'status',
      'priority',
      'assignee',
      'estimatedHours',
      'dueDate',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (task as any)[field] = req.body[field];
      }
    });

    await task.save();
    res.status(200).json(task);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task' });
    return;
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (req.user?.role === 'manager' && (task.project as any).manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (req.user?.role === 'user') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await task.deleteOne();
    res.status(200).json({ message: 'Task deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task' });
    return;
  }
};
