import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { createTeam, deleteTeam, getTeam, getTeams, updateTeam } from "../controllers/teamController";

const router: Router = Router();

// Get /teams: Get all teams
router.get('/', authenticate, getTeams);

// GET /team/:id: Get a specific team by ID
router.get('/:id', authenticate, getTeam);

// POST /team: Create a new team
router.post('/', authenticate, createTeam);

// PUT /team/:id: Update a team by ID
router.put('/:id', authenticate, updateTeam);

// DELETE /team/:id: Delete a team by ID
router.delete('/:id', authenticate, deleteTeam);

export default router;