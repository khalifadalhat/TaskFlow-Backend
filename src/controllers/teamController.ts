import { Response } from 'express';
import Team from '../models/Team';
import Project from '../models/Project';
import { AuthRequest } from '../middleware/authMiddleware';

export const getTeams = async (req: AuthRequest, res: Response) => {
  try {
    let filter: any = {};

    if (req.user?.role === 'manager') {
      filter.manager = req.user.id;
    }

    if (req.user?.role === 'user') {
      filter.members = req.user.id;
    }

    const teams = await Team.find(filter)
      .populate('manager', 'firstName lastName')
      .populate('members', 'firstName lastName')
      .populate('project', 'projectName');

    res.status(200).json(teams);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve teams' });
    return;
  }
};

export const getTeam = async (req: AuthRequest, res: Response) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('manager', 'firstName lastName')
      .populate('members', 'firstName lastName')
      .populate('project', 'projectName manager');

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!team.manager) {
      res.status(400).json({ message: 'Team has no manager assigned' });
      return;
    }

    const { role, id } = req.user;

    if (role === 'user' && !team.members.some(memberId => memberId.toString() === id)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (role === 'manager' && team.manager.toString() !== id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json(team);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve team' });
    return;
  }
};

export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role === 'user') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const { name, members, project } = req.body;

    if (!name || !members?.length || !project) {
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

    const team = await Team.create({
      name,
      members,
      project,
      manager: req.user.id,
    });

    res.status(201).json(team);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to create team' });
    return;
  }
};

export const updateTeam = async (req: AuthRequest, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    if (!team.manager) {
      res.status(400).json({ message: 'Team has no manager assigned' });
      return;
    }

    if (req.user?.role === 'manager' && team.manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (req.user?.role === 'user') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const allowedUpdates = ['name', 'members'];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (team as any)[field] = req.body[field];
      }
    });

    await team.save();
    res.status(200).json(team);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to update team' });
    return;
  }
};

export const deleteTeam = async (req: AuthRequest, res: Response) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    if (!team.manager) {
      res.status(400).json({ message: 'Team has no manager assigned' });
      return;
    }

    if (req.user?.role === 'manager' && team.manager.toString() !== req.user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    if (req.user?.role === 'user') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    await team.deleteOne();
    res.status(200).json({ message: 'Team deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete team' });
    return;
  }
};
