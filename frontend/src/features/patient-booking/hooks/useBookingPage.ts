import { useEffect, useMemo, useState } from 'react';
import { fetchDoctorsForBooking, submitBooking } from '../api';
import { BookingPayload, BookingStep, DoctorProfile, BookingConfirmation } from '../types';

export function useBookingPage() {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<BookingStep>('select_doctor');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [formValues, setFormValues] = useState({ patientName: '', mobile: '', symptoms: '' });
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    async function loadDoctors() {
      setLoading(true);
      setDoctors(await fetchDoctorsForBooking());
      setLoading(false);
    }
    loadDoctors();
  }, []);

  const currentDoctor = useMemo(() => selectedDoctor ?? doctors[0] ?? null, [selectedDoctor, doctors]);

  function updateForm(field: string, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  function selectDoctor(doctor: DoctorProfile) {
    setSelectedDoctor(doctor);
    setSelectedSlot('');
  }

  async function nextStep() {
    if (step === 'select_doctor') {
      setStep('fill_details');
      return;
    }
    if (step === 'fill_details') {
      setStep('confirmation');
    }
  }

  async function submitForm() {
    if (!currentDoctor || !selectedSlot) {
      return null;
    }

    const payload: BookingPayload = {
      doctorId: currentDoctor.id,
      doctorName: currentDoctor.name,
      slot: selectedSlot,
      patientName: formValues.patientName,
      mobile: formValues.mobile,
      symptoms: formValues.symptoms,
    };
    setLoading(true);
    const result = await submitBooking(payload);
    setLoading(false);
    setConfirmation(result);
    setStep('confirmation');
    return result;
  }

  return {
    doctors,
    loading,
    step,
    selectedDoctor: currentDoctor,
    selectedSlot,
    formValues,
    confirmation,
    setSelectedSlot,
    updateForm,
    selectDoctor,
    nextStep,
    submitForm,
    setStep,
  };
}
