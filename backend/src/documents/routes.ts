import { Router } from 'express';
import { DocumentsService } from './service';

export const documentRouter = Router();

documentRouter.post('/upload-url', async (req, res) => {
  res.json(await DocumentsService.placeholder());
});

documentRouter.post('/confirm', async (req, res) => {
  res.json(await DocumentsService.placeholder());
});

documentRouter.get('/:id', async (req, res) => {
  res.json(await DocumentsService.placeholder());
});

documentRouter.get('/:id/download', async (req, res) => {
  res.json(await DocumentsService.placeholder());
});

documentRouter.delete('/:id', async (req, res) => {
  res.json(await DocumentsService.placeholder());
});
