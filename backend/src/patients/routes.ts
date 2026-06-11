import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';

export const patientRouter = Router();

const PATIENT_RECORDS: Record<string, any> = {
  pat_1: {
    id: 'pat_1',
    name: 'Rohan Kumar',
    age: 34,
    gender: 'Male',
    bloodGroup: 'B+',
    allergies: ['Penicillin'],
    mobile: '91XXXXX3210',
    email: 'rohan.k@email.com',
    curoId: 'PAT-000142',
    consultations: [
      { id: 'c1', date: '2026-06-09', doctor: 'Dr. Arun Sharma', complaint: 'Viral fever', type: 'ONLINE', status: 'COMPLETED' },
      { id: 'c2', date: '2025-04-07', doctor: 'Dr. Arun Sharma', complaint: 'Fever follow-up', type: 'ONLINE', status: 'COMPLETED' },
      { id: 'c3', date: '2024-11-11', doctor: 'Dr. Arun Sharma', complaint: 'Viral fever', type: 'IN_PERSON', status: 'COMPLETED' },
      { id: 'c4', date: '2024-03-03', doctor: 'Dr. Arun Sharma', complaint: 'Gastritis', type: 'IN_PERSON', status: 'COMPLETED' },
    ],
    prescriptions: [
      { id: 'p1', date: '2026-06-09', serial: 'RX-SHARMA-0143', diagnosis: 'Viral fever', doctor: 'Dr. Arun Sharma' },
      { id: 'p2', date: '2025-04-07', serial: 'RX-SHARMA-0119', diagnosis: 'Viral fever follow-up', doctor: 'Dr. Arun Sharma' },
    ],
    reports: [
      { id: 'r1', name: 'CBC with differential', date: '2024-11-14', type: 'Blood test' },
      { id: 'r2', name: 'Dengue NS1 Antigen', date: '2024-11-14', type: 'Serology' },
    ],
  },
};

/** GET /api/v1/patients/me — authenticated patient's own records */
patientRouter.get('/me', requireAuth, requireRole('PATIENT'), (req: any, res) => {
  const user = req.user;
  // In real app: look up patientId from user record in DB
  const records = PATIENT_RECORDS['pat_1']; // demo
  return res.json({ success: true, data: records });
});

/** GET /api/v1/patients/:id — doctor can view any patient record */
patientRouter.get('/:id', requireAuth, (req: any, res) => {
  const record = PATIENT_RECORDS[req.params.id];
  if (!record) return res.status(404).json({ success: false, message: 'Patient not found' });
  return res.json({ success: true, data: record });
});
