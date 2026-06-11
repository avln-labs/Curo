import { useEffect, useState } from 'react';
import { fetchConsultations, fetchConsultationNotes, fetchPrescriptionPreview } from '../api';
import { ConsultationNote, ConsultationSession, PrescriptionPreview } from '../types';

export function useConsultationDashboard() {
  const [consultations, setConsultations] = useState<ConsultationSession[]>([]);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [prescription, setPrescription] = useState<PrescriptionPreview | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sessions, notesData, medication] = await Promise.all([
        fetchConsultations(),
        fetchConsultationNotes(),
        fetchPrescriptionPreview(),
      ]);
      setConsultations(sessions);
      setNotes(notesData);
      setPrescription(medication);
      setSelectedId(sessions[0]?.id ?? null);
      setLoading(false);
    }
    load();
  }, []);

  const selectedSession = consultations.find((item) => item.id === selectedId) ?? consultations[0] ?? null;

  return {
    consultations,
    notes,
    prescription,
    selectedSession,
    selectedId,
    loading,
    setSelectedId,
  };
}
