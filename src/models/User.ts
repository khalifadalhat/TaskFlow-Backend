import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  username: string;
  password: string;
  profilePicture: string;
  role: string;
  skills: string;
  availability: boolean;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  role: {
    type: String,
    required: true,
    enum: ["Admin", "Manager", "Team Member"],
  },
  skills: { type: String, default: "" },
  availability: { type: Boolean, default: true },
});
const User = model<IUser>("User", userSchema);

export default User;
