import { Request, Response } from "express";
import Project from "../models/Project";

const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await Project.find().populate({
        path: 'projectMembers',
        select: 'firstName lastName' 
      }); 
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve projects" });
  }
};
const getProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).populate({path:"projectMembers", select:"firstName lastName"});
    if (!project) {
      res.status(404).json({ error: "Project not found" });
    } else {
      res.status(200).json(project);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve project" });
  }
};

const createProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to create project" });
  }
};

const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
    } else {
      res.status(200).json(project);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
  }
};

const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
    } else {
      res.status(200).json(project);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
};

export { getProjects, getProject, createProject, updateProject, deleteProject };
