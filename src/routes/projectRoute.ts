import { Router } from "express";
import { createProject, deleteProject, getProject, getProjects, updateProject } from "../controllers/projectController";
import { authenticate } from "../middleware/authMiddleware";

const router: Router = Router();

// GET /projects: Get all projects
router.get('/', getProjects);

// GET /projects/:id: Get a specific project by ID
router.get('/:id', getProject);

// POST /projects: Create a new project
router.post('/', authenticate, createProject);

// PUT /projects/:id: Update a project by ID
router.put('/:id', authenticate, updateProject);

// DELETE /projects/:id: Delete a project by ID
router.delete('/:id', authenticate, deleteProject);

export default router;