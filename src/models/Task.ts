import { Schema, model, Document } from "mongoose";

interface ITask extends Document {
        taskTitle: string;
        taskDescription: string;
        taskStatus: string;
        taskPriority: string;
        taskAssignee: string;
        taskEstimatedTime: number;
        taskTimeSpent: number;
    }
    
    const taskSchema = new Schema<ITask>({
        taskTitle: { type: String, required: true },
        taskDescription: { type: String, required: true },
        taskStatus: { type: String, required: true },
        taskPriority: { type: String, required: true },
        taskAssignee: { type: String, required: true },
        taskEstimatedTime: { type: Number, required: true },
        taskTimeSpent: { type: Number, required: true },
    });
    
    const Task = model<ITask>("Task", taskSchema);
    
    export default Task;