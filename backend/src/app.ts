import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './shared/env';
import { authRouter } from './auth/routes';
import { doctorRouter } from './doctors/routes';
import { patientRouter } from './patients/routes';
import { bookingRouter } from './bookings/routes';
import { consultationRouter } from './consultations/routes';
import { prescriptionRouter } from './prescriptions/routes';
import { paymentRouter } from './payments/routes';
import { documentRouter } from './documents/routes';
import { notificationRouter } from './notifications/routes';
import { adminRouter } from './admin/routes';
import { healthThreadsRouter } from './health_threads/routes';
import { medicineRouter } from './medicines/routes';

const app = express();

app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth',          authRouter);
app.use('/api/v1/doctors',       doctorRouter);
app.use('/api/v1/patients',      patientRouter);
app.use('/api/v1/bookings',      bookingRouter);
app.use('/api/v1/consultations', consultationRouter);
app.use('/api/v1/prescriptions', prescriptionRouter);
app.use('/api/v1/payments',      paymentRouter);
app.use('/api/v1/documents',     documentRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/admin',         adminRouter);
app.use('/api/v1/health_threads', healthThreadsRouter);
app.use('/api/v1/medicines',     medicineRouter);

// Health check
app.get('/api/v1/health', (_req, res) => res.json({
  status: 'ok',
  service: 'curo-backend',
  version: '0.1.0',
  timestamp: new Date().toISOString(),
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

export default app;
