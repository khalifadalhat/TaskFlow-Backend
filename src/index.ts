import express, { Application } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoute from './routes/authRoute';
import userRoute from './routes/userRoute';
import projectRoute from './routes/projectRoute';
import taskRoute from './routes/taskRoute';
import teamRoute from './routes/teamRoute';

dotenv.config();

const app: Application = express();
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
app.use(express.json());

// Use routes
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/projects', projectRoute);
app.use('/tasks', taskRoute);
app.use('/teams', teamRoute);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('Failed to connect to MongoDB', err));

const port = process.env.PORT ?? 8080;
app.listen(port, () => console.log(`Server running on port ${port}`));
