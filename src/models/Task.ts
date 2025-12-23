import { Schema, model, Document, Types } from 'mongoose';

interface IComment {
  user: Types.ObjectId;
  message: string;
  createdAt: Date;
}

interface ITask extends Document {
  title: string;
  description: string;
  status: 'todo' | 'inProgress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: Types.ObjectId[];
  assigner: Types.ObjectId;
  project: Types.ObjectId;
  estimatedHours?: number;
  timeSpent: number;
  dueDate?: Date;
  comments: IComment[];
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['todo', 'inProgress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignee: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
    },
    assigner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    estimatedHours: { type: Number },
    timeSpent: { type: Number, default: 0 },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

const Task = model<ITask>('Task', taskSchema);

export default Task;
