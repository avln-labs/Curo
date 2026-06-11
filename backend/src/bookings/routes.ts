import { Router } from 'express';
import { BookingsService } from './service';

export const bookingRouter = Router();

bookingRouter.post('/', async (req, res) => {
  res.json(await BookingsService.placeholder());
});

bookingRouter.get('/:id', async (req, res) => {
  res.json(await BookingsService.placeholder());
});

bookingRouter.put('/:id/status', async (req, res) => {
  res.json(await BookingsService.placeholder());
});

bookingRouter.post('/:id/cancel', async (req, res) => {
  res.json(await BookingsService.placeholder());
});
