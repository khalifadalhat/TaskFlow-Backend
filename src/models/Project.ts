import mongoose, { Schema, model, Document } from "mongoose";

interface IProject extends Document {
  projectName: string;
  projectDescription: string;
  projectMilestone: string;
  projectTasks: string[];
  projectMembers: mongoose.Schema.Types.ObjectId[];
  projectStartDate: Date;
  projectEndDate: Date;
}

const projectSchema = new Schema<IProject>({
    projectName: { type: String, required: true },
    projectDescription: { type: String, required: true },
    projectTasks: { type: [String], default: [] },
    projectMilestone: { type: String, required: true },
    projectMembers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    projectStartDate: { type: Date, required: true },
    projectEndDate: { type: Date, required: true },
    
})

const Project = model<IProject>("Project", projectSchema);

export default Project;