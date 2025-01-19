import { Router } from "express";
import { createTask, deleteTask, getTask, getTasks, updateTask } from "../controllers/taskController";
import { authenticate } from "../middleware/authMiddleware";

const router: Router = Router();

// GET /tasks: Get all tasks
router.get('/', getTasks);  

// GET /tasks/:id: Get a specific task by ID
router.get('/:id', getTask);

// POST /tasks: Create a new task
router.post('/', authenticate, createTask);

// PUT /tasks/:id: Update a task by ID
router.put('/:id', authenticate, updateTask);

// DELETE /tasks/:id: Delete a task by ID
router.delete('/:id', authenticate, deleteTask);

export default router;