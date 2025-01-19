import { Request, Response } from "express";
import Task from "../models/Task";

export const createTask = async (req: Request, res: Response) => {
    try {
        const task = await Task.create(req.body);
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: "Failed to create task" });
    }
};

export const getTask = async (req: Request, res: Response) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
        } else {
            res.status(200).json(task);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve task" });
    }
};

export const getTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve tasks" });
    }
};  
export const updateTask = async (req: Request, res: Response) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!task) {
            res.status(404).json({ error: "Task not found" });
        } else {
            res.status(200).json(task);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update task" });
    }
};  
export const deleteTask = async (req: Request, res: Response) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
        } else {
            res.status(200).json(task);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to delete task" });
    }
};  
