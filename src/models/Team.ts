import { Schema, model, Document, Types } from 'mongoose';

interface ITeam extends Document {
  teamName: string;
  manager?: Types.ObjectId;
  members: Types.ObjectId[];
  availableResources: string[];
}

const teamSchema = new Schema<ITeam>(
  {
    teamName: { type: String, required: true, unique: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    availableResources: [{ type: String }],
  },
  { timestamps: true }
);

const Team = model<ITeam>('Team', teamSchema);

export default Team;
