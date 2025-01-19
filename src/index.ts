import express, { Application } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoute from './routes/authRoute';
import userRoute from './routes/userRoute';
import projectRoute from './routes/projectRoute';

dotenv.config();

const app: Application = express();
app.use(express.json()); // To parse JSON body data

// Use routes
app.use('/auth', authRoute); // Auth routes (login, register)
app.use('/user', userRoute); // User routes (profile access, update)
app.use('/projects', projectRoute); // Project routes (CRUD operations)

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Failed to connect to MongoDB', err));

const port = process.env.PORT ?? 8080;
app.listen(port, () => console.log(`Server running on port ${port}`));
