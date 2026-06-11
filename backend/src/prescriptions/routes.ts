import { Router } from 'express';
import { PrescriptionsService } from './service';

export const prescriptionRouter = Router();

prescriptionRouter.post('/', async (req, res) => {
  res.json(await PrescriptionsService.placeholder());
});

prescriptionRouter.get('/:id', async (req, res) => {
  res.json(await PrescriptionsService.placeholder());
});

prescriptionRouter.get('/:id/pdf', async (req, res) => {
  res.json(await PrescriptionsService.placeholder());
});

prescriptionRouter.post('/:id/send-whatsapp', async (req, res) => {
  res.json(await PrescriptionsService.placeholder());
});

prescriptionRouter.post('/:id/amend', async (req, res) => {
  res.json(await PrescriptionsService.placeholder());
});

prescriptionRouter.get('/patient/:id', async (req, res) => {
  res.json(await PrescriptionsService.placeholder());
});
