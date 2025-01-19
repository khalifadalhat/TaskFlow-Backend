import { Request, Response } from "express";
import Team from "../models/Team";

export const getTeams = async (req: Request, res: Response) => {
    try {
        const teams = await Team.find();
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve teams" });
    }
};

export const getTeam = async (req: Request, res: Response) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            res.status(404).json({ error: "Team not found" });
        } else {
            res.status(200).json(team);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve team" });
    }
};

export const createTeam = async (req: Request, res: Response) => {
    try {
        const team = await Team.create(req.body);
        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ error: "Failed to create team" });
    }
};

export const updateTeam = async (req: Request, res: Response) => {
    try {
        const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!team) {
            res.status(404).json({ error: "Team not found" });
        } else {
            res.status(200).json(team);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update team" });
    }
};

export const deleteTeam = async (req: Request, res: Response) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);
        if (!team) {
            res.status(404).json({ error: "Team not found" });
        } else {
            res.status(200).json(team);
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to delete team" });
    }
};
