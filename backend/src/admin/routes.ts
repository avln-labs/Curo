import { Router } from 'express';
import { AdminService } from './service';

export const adminRouter = Router();

adminRouter.get('/doctors', async (req, res) => {
  res.json(await AdminService.placeholder());
});

adminRouter.put('/doctors/:id/verify', async (req, res) => {
  res.json(await AdminService.placeholder());
});

adminRouter.get('/appointments', async (req, res) => {
  res.json(await AdminService.placeholder());
});

adminRouter.post('/refunds/:id/approve', async (req, res) => {
  res.json(await AdminService.placeholder());
});

adminRouter.get('/analytics', async (req, res) => {
  res.json(await AdminService.placeholder());
});

adminRouter.put('/doctors/:id/suspend', async (req, res) => {
  res.json(await AdminService.placeholder());
});
