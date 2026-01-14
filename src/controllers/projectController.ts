import { Request, Response } from 'express';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/authMiddleware';

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.user?.role === 'manager' ? { manager: req.user.id } : {};

    const projects = await Project.find(filter)
      .populate('members', 'firstName lastName')
      .populate('manager', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve projects' });
    return;
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'firstName lastName')
      .populate('manager', 'firstName lastName');

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (req.user?.role === 'manager' && project.manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json(project);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve project' });
    return;
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'user') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const { projectName, projectDescription, startDate, endDate, team, members } = req.body;

    if (!projectName || !projectDescription || !startDate) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const project = await Project.create({
      projectName,
      projectDescription,
      startDate,
      endDate,
      team,
      members,
      manager: req.user.id,
    });

    res.status(201).json(project);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project' });
    return;
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (req.user?.role === 'manager' && project.manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const allowedUpdates = [
      'projectName',
      'projectDescription',
      'startDate',
      'endDate',
      'status',
      'team',
      'members',
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (project as any)[field] = req.body[field];
      }
    });

    await project.save();

    res.status(200).json(project);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to update project' });
    return;
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (req.user?.role === 'manager' && project.manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await project.deleteOne();

    res.status(200).json({ message: 'Project deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project' });
    return;
  }
};
