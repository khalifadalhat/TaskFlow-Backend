import { Schema, model, Document } from "mongoose";

interface ITeam extends Document {
    teamName: string;
    teamMembers: string[];
    availableResources: string[];
}

const teamSchema = new Schema<ITeam>({
    teamName: { type: String, required: true },
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    availableResources: [{ type: Schema.Types.ObjectId, ref: 'Resource' }]
});

const Team = model<ITeam>("Team", teamSchema);

export default Team;