import { Router } from 'express';
import { NotificationsService } from './service';

export const notificationRouter = Router();

notificationRouter.get('/', async (req, res) => {
  res.json(await NotificationsService.placeholder());
});

notificationRouter.put('/:id/read', async (req, res) => {
  res.json(await NotificationsService.placeholder());
});

notificationRouter.post('/preferences', async (req, res) => {
  res.json(await NotificationsService.placeholder());
});
