import { useState, useEffect } from 'react';
import { fetchDoctorAppointments, fetchDoctorSchedule, submitDoctorProfile } from '../api';
import { DoctorOnboardingPayload, DoctorAppointment, DoctorScheduleSlot } from '../types';

export function useDoctorOnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [schedule, setSchedule] = useState<DoctorScheduleSlot[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [appointmentsData, scheduleData] = await Promise.all([
        fetchDoctorAppointments(),
        fetchDoctorSchedule(),
      ]);
      setAppointments(appointmentsData);
      setSchedule(scheduleData);
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleSubmit(payload: DoctorOnboardingPayload) {
    setLoading(true);
    const result = await submitDoctorProfile(payload);
    setMessage(result.message);
    setLoading(false);
    return result;
  }

  return {
    appointments,
    schedule,
    loading,
    message,
    handleSubmit,
  };
}
