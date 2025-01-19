import { Router } from "express";
import { createProject, deleteProject, getProject, getProjects, updateProject } from "../controllers/projectController";
import { authenticate } from "../middleware/authMiddleware";

const router: Router = Router();

// GET /project: Get all projects
router.get('/', authenticate, getProjects);

// GET /project/:id: Get a specific project by ID
router.get('/:id', authenticate, getProject);

// POST /project: Create a new project
router.post('/', authenticate, createProject);

// PUT /project/:id: Update a project by ID
router.put('/:id', authenticate, updateProject);

// DELETE /project/:id: Delete a project by ID
router.delete('/:id', authenticate, deleteProject);

export default router;