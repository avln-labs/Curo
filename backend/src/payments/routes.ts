import { Router } from 'express';
import { PaymentsService } from './service';

export const paymentRouter = Router();

paymentRouter.post('/order', async (req, res) => {
  res.json(await PaymentsService.placeholder());
});

paymentRouter.post('/verify', async (req, res) => {
  res.json(await PaymentsService.placeholder());
});

paymentRouter.post('/webhook', async (req, res) => {
  res.json(await PaymentsService.placeholder());
});

paymentRouter.post('/:id/refund', async (req, res) => {
  res.json(await PaymentsService.placeholder());
});

paymentRouter.get('/:id', async (req, res) => {
  res.json(await PaymentsService.placeholder());
});

paymentRouter.get('/doctors/:id/payouts', async (req, res) => {
  res.json(await PaymentsService.placeholder());
});
