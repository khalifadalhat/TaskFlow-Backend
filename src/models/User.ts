import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  role: string;
  skills: string;
  availability: boolean;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
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
