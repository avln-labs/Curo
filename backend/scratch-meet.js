require('ts-node/register');
const { db } = require('./src/shared/database');
const { GoogleCalendarService } = require('./src/doctors/google');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
  try {
    const doctor = await db.queryOne(`SELECT google_refresh_token, full_name FROM doctors WHERE google_refresh_token IS NOT NULL LIMIT 1`);
    if (!doctor) {
      console.log('No doctor with refresh token found.');
      return;
    }

    console.log('Found doctor:', doctor.full_name);
    console.log('Calling createMeetEvent...');

    const res = await GoogleCalendarService.createMeetEvent(doctor.google_refresh_token, {
      id: 'test-event-id-' + Date.now(),
      doctorName: doctor.full_name,
      patientName: 'Test Patient',
      slotDate: '2026-06-26',
      slotTime: '10:00:00',
      chiefComplaint: 'Headache',
    });

    console.log('Success!', res);
  } catch (err) {
    console.error('Error in createMeetEvent:', err);
    if (err.response && err.response.data) {
      console.error('API Error Response:', JSON.stringify(err.response.data, null, 2));
    }
  } finally {
    process.exit(0);
  }
}
test();
