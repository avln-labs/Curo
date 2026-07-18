/**
 * Prescriptions Service
 *
 * Handles creation of prescriptions, attaching medications, and PDF generation.
 */

import { db } from '../shared/database';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface MedicationData {
  drugName: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

interface CreatePrescriptionData {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  investigations?: string;
  advice?: string;
  followupDate?: string;
  medications: MedicationData[];
}

export const PrescriptionsService = {

  /** Create a new prescription */
  async createPrescription(data: CreatePrescriptionData) {
    // Generate serial number
    const serial = `RX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    let prescriptionId: string;

    await db.transaction(async (client) => {
      // Create prescription row
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO prescriptions (
           appointment_id, patient_id, doctor_id,
           serial_number, diagnosis, investigations, advice, followup_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date)
         RETURNING id`,
        [
          data.appointmentId, data.patientId, data.doctorId, serial,
          data.diagnosis ?? null, data.investigations ?? null, data.advice ?? null,
          data.followupDate ?? null,
        ]
      );
      prescriptionId = rows[0].id;

      // Insert medications
      for (const med of data.medications) {
        await client.query(
          `INSERT INTO prescription_medications (
             prescription_id, drug_name, dose, frequency, duration, instructions
           ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            prescriptionId, med.drugName, med.dose ?? null, med.frequency ?? null,
            med.duration ?? null, med.instructions ?? null,
          ]
        );
      }
    });

    return { success: true, message: 'Prescription created.', prescriptionId: prescriptionId! };
  },

  /** Get prescription details */
  async getById(prescriptionId: string) {
    const rx = await db.queryOne<{
      id: string;
      serial_number: string;
      diagnosis: string | null;
      investigations: string | null;
      advice: string | null;
      followup_date: string | null;
      created_at: string;
      doctor_name: string;
      qualifications: string[];
      registration_number: string;
      city: string;
      clinic_name: string | null;
      specialisations: string[];
      patient_name: string;
      date_of_birth: string | null;
      gender: string | null;
      patient_mobile: string;
      slot_date: string;
    }>(
      `SELECT
         pr.id, pr.serial_number, pr.diagnosis, pr.investigations, pr.advice, pr.followup_date, pr.created_at,
         d.full_name as doctor_name, d.qualifications, d.registration_number, d.city, d.clinic_name, d.specialisations,
         d.signature_url,
         p.full_name as patient_name, p.date_of_birth, p.gender,
         u.mobile as patient_mobile,
         a.slot_date
       FROM prescriptions pr
       JOIN doctors d ON d.id = pr.doctor_id
       JOIN patients p ON p.id = pr.patient_id
       JOIN users u ON u.id = p.user_id
       JOIN appointments a ON a.id = pr.appointment_id
       WHERE pr.id = $1`,
      [prescriptionId]
    );

    if (!rx) return null;

    const { rows: medications } = await db.query(
      `SELECT drug_name, dose, frequency, duration, instructions
       FROM prescription_medications
       WHERE prescription_id = $1
       ORDER BY sort_order ASC`,
      [prescriptionId]
    );

    return { ...rx, medications };
  },

  /** Generate PDF Buffer (in memory) */
  async generatePdfBuffer(prescriptionId: string): Promise<Buffer | null> {
    const data = await this.getById(prescriptionId);
    if (!data) return null;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- PDF Drawing ---

      // Header: Clinic/Doctor Info
      doc.fontSize(20).font('Helvetica-Bold').text(data.clinic_name || 'CURO CLINC', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text(data.doctor_name);
      if (data.qualifications?.length) {
        doc.fontSize(10).font('Helvetica').text(data.qualifications.join(', '));
      }
      if (data.specialisations?.length) {
        doc.fontSize(10).text(data.specialisations.join(' · '));
      }
      doc.fontSize(10).text(`Reg No: ${data.registration_number}`);
      doc.moveDown();
      
      // Divider
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);

      // Patient Info row
      const patientY = doc.y;
      
      // Calculate age from DOB
      let ageStr = 'Unknown age';
      if (data.date_of_birth) {
        const diffMs = Date.now() - new Date(data.date_of_birth).getTime();
        const age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
        ageStr = `${age} yrs`;
      }

      doc.fontSize(10).font('Helvetica-Bold').text('Patient: ', 50, patientY, { continued: true })
         .font('Helvetica').text(`${data.patient_name} (${ageStr}, ${data.gender})`);
      
      doc.font('Helvetica-Bold').text('Date: ', 400, patientY, { continued: true })
         .font('Helvetica').text(new Date(data.slot_date).toLocaleDateString());

      doc.font('Helvetica-Bold').text('Mobile: ', 50, doc.y + 5, { continued: true })
         .font('Helvetica').text(data.patient_mobile);

      doc.font('Helvetica-Bold').text('Rx No: ', 400, doc.y - 12, { continued: true })
         .font('Helvetica').text(data.serial_number);

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // Clinical notes
      if (data.diagnosis) {
        doc.fontSize(11).font('Helvetica-Bold').text('Diagnosis:');
        doc.fontSize(10).font('Helvetica').text(data.diagnosis);
        doc.moveDown();
      }

      // Rx Symbol
      doc.fontSize(16).font('Helvetica-Bold').text('Rx', { continued: false });
      doc.moveDown(0.5);

      // Medications Table
      let i = 1;
      for (const m of data.medications) {
        doc.fontSize(11).font('Helvetica-Bold').text(`${i}. ${m.drug_name}`);
        
        const details = [];
        if (m.dose) details.push(`Dose: ${m.dose}`);
        if (m.frequency) details.push(`Frequency: ${m.frequency}`);
        if (m.duration) details.push(`Duration: ${m.duration}`);
        
        if (details.length > 0) {
          doc.fontSize(10).font('Helvetica').text(details.join('  |  '), { indent: 15 });
        }
        
        if (m.instructions) {
          doc.fontSize(10).font('Helvetica-Oblique').text(`Instructions: ${m.instructions}`, { indent: 15 });
        }
        
        doc.moveDown(0.5);
        i++;
      }

      doc.moveDown();

      // Additional fields
      if (data.investigations) {
        doc.fontSize(11).font('Helvetica-Bold').text('Investigations advised:');
        doc.fontSize(10).font('Helvetica').text(data.investigations);
        doc.moveDown();
      }

      if (data.advice) {
        doc.fontSize(11).font('Helvetica-Bold').text('Advice:');
        doc.fontSize(10).font('Helvetica').text(data.advice);
        doc.moveDown();
      }

      if (data.followup_date) {
        doc.fontSize(11).font('Helvetica-Bold').text(`Next follow-up: `, { continued: true })
           .font('Helvetica').text(new Date(data.followup_date).toLocaleDateString());
        doc.moveDown(2);
      } else {
        doc.moveDown(2);
      }

      // E-Signature
      if ((data as any).signature_url) {
        try {
          const sigBase64 = (data as any).signature_url.split(',')[1];
          if (sigBase64) {
            const imgBuffer = Buffer.from(sigBase64, 'base64');
            // Align to the right
            doc.image(imgBuffer, 400, doc.y, { fit: [100, 50], align: 'right' });
            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica-Bold').text('Dr. Signature', 400, doc.y + 55, { align: 'center', width: 100 });
          }
        } catch (err) {
          console.error('Failed to embed signature image:', err);
        }
      }

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique')
         .text('This teleconsultation prescription is digitally generated through CURO in compliance with the Telemedicine Practice Guidelines (TPG), 2020.', 50, 750, { align: 'center' });

      doc.end();
    });
  },

  /** Get prescription by appointment ID */
  async getByAppointmentId(appointmentId: string) {
    const rx = await db.queryOne<{ id: string }>(
      `SELECT id FROM prescriptions WHERE appointment_id = $1`,
      [appointmentId]
    );
    return rx ? this.getById(rx.id) : null;
  },

  /** Get all prescriptions for a doctor */
  async getByDoctorId(doctorId: string) {
    const { rows } = await db.query<{
      id: string;
      serial_number: string;
      diagnosis: string | null;
      created_at: string;
      patient_name: string;
      slot_date: string;
    }>(
      `SELECT pr.id, pr.serial_number, pr.diagnosis, pr.created_at, p.full_name as patient_name, a.slot_date
       FROM prescriptions pr
       JOIN patients p ON p.id = pr.patient_id
       JOIN appointments a ON a.id = pr.appointment_id
       WHERE pr.doctor_id = $1
       ORDER BY pr.created_at DESC`,
      [doctorId]
    );
    return rows;
  }
};
