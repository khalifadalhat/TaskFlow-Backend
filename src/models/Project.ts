import { Schema, model, Document, Types } from 'mongoose';

interface IProject extends Document {
  projectName: string;
  projectDescription: string;
  startDate: Date;
  endDate?: Date;
  manager: Types.ObjectId;
  team?: Types.ObjectId;
  members: Types.ObjectId[];
  tasks: Types.ObjectId[];
  status: 'planning' | 'inProgress' | 'completed' | 'onHold';
}

const projectSchema = new Schema<IProject>(
  {
    projectName: { type: String, required: true },
    projectDescription: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    members: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (v: Types.ObjectId[]) => v.length > 0,
        message: 'Project must have at least one member',
      },
    },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    status: {
      type: String,
      enum: ['planning', 'inProgress', 'completed', 'onHold'],
      default: 'planning',
    },
  },
  { timestamps: true }
);

const Project = model<IProject>('Project', projectSchema);

export default Project;
