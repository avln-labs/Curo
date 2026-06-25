const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query(`
      SELECT 
        a.id, a.status, a.meet_link, 
        d.google_refresh_token IS NOT NULL as has_token,
        ct.type as consultation_type
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      JOIN consultation_types ct ON ct.id = a.consultation_type_id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
check();
