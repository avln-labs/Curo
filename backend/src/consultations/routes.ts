import { Router } from 'express';
import { ConsultationsService } from './service';

export const consultationRouter = Router();

consultationRouter.get('/:id', async (req, res) => {
  res.json(await ConsultationsService.placeholder());
});

consultationRouter.post('/:id/notes', async (req, res) => {
  res.json(await ConsultationsService.placeholder());
});

consultationRouter.post('/:id/start', async (req, res) => {
  res.json(await ConsultationsService.placeholder());
});

consultationRouter.post('/:id/complete', async (req, res) => {
  res.json(await ConsultationsService.placeholder());
});

consultationRouter.get('/:id/summary', async (req, res) => {
  res.json(await ConsultationsService.placeholder());
});

consultationRouter.post('/:id/summary/regenerate', async (req, res) => {
  res.json(await ConsultationsService.placeholder());
});

consultationRouter.put('/:id/summary', async (req, res) => {
  res.json(await ConsultationsService.placeholder());
});
