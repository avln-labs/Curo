import { Router } from 'express';
import { HealthThreadsService } from './service';

export const healthThreadsRouter = Router();

healthThreadsRouter.get('/:patientId', async (req, res) => {
  res.json(await HealthThreadsService.placeholder());
});

healthThreadsRouter.get('/:patientId/share-link', async (req, res) => {
  res.json(await HealthThreadsService.placeholder());
});

healthThreadsRouter.post('/:patientId/share-link', async (req, res) => {
  res.json(await HealthThreadsService.placeholder());
});

healthThreadsRouter.delete('/:patientId/share-link/:token', async (req, res) => {
  res.json(await HealthThreadsService.placeholder());
});
