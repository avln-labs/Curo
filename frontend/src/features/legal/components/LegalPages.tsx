import React from 'react';

const PageContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', justifyContent: 'center', padding: '60px 24px' }}>
    <div style={{ maxWidth: 800, width: '100%', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '40px', boxShadow: 'var(--shadow-sm)' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: 24, color: 'var(--text-primary)' }}>{title}</h1>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
        {children}
      </div>
    </div>
  </main>
);

export const TermsOfService = () => (
  <PageContainer title="Terms of Service">
    <h2>1. Acceptance of Terms</h2>
    <p>By accessing and using CURO, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.</p>

    <h2>2. Description of Service</h2>
    <p>CURO is a digital healthcare platform that provides a clinical workspace for independent doctors and a patient portal for managing health records and teleconsultations.</p>

    <h2>3. User Responsibilities</h2>
    <p>You are responsible for maintaining the confidentiality of your account information. You agree to provide accurate and complete information when creating an account.</p>

    <h2>4. Medical Disclaimer</h2>
    <p>CURO provides technology solutions and does not directly provide medical advice. Any information provided through the platform is for informational purposes and does not replace professional medical judgment.</p>

    <h2>5. Modifications</h2>
    <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
  </PageContainer>
);

export const PrivacyPolicy = () => (
  <PageContainer title="Privacy Policy">
    <h2>1. Data Collection</h2>
    <p>We collect personal and health information necessary to provide our services, including names, contact details, medical history, and consultation records.</p>

    <h2>2. Use of Information</h2>
    <p>Your information is used to facilitate healthcare services, improve platform functionality, and communicate with you regarding appointments and health updates.</p>

    <h2>3. Data Protection (DPDP Act, 2023)</h2>
    <p>We process your personal and health data in compliance with the Digital Personal Data Protection Act, 2023. We employ industry-standard security measures to protect your data against unauthorized access.</p>

    <h2>4. Data Sharing</h2>
    <p>Your medical records are shared only with healthcare professionals you explicitly interact with on the platform. We do not sell your personal data to third parties.</p>

    <h2>5. Your Rights</h2>
    <p>You have the right to access, correct, or request deletion of your personal data by contacting our support team.</p>
  </PageContainer>
);
