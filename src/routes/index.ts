import { Router } from 'express';
import authRoute from './authRoute';
import userRoute from './userRoute';
import projectRoute from './projectRoute';
import taskRoute from './taskRoute';
import teamRoute from './teamRoute';
import dashboardRoute from './adminRoute';

const rootRouter = Router();

rootRouter.use('/auth', authRoute);
rootRouter.use('/users', userRoute);
rootRouter.use('/projects', projectRoute);
rootRouter.use('/tasks', taskRoute);
rootRouter.use('/teams', teamRoute);
rootRouter.use('/dashboard', dashboardRoute);

export default rootRouter;
