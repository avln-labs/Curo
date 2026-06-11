export type AuthUser = {
  id: string;
  role: 'DOCTOR' | 'PATIENT' | 'ADMIN';
};

export type DoctorProfile = {
  id: string;
  full_name: string;
  slug: string;
};

export type PatientRecord = {
  id: string;
  title: string;
  date: string;
};
