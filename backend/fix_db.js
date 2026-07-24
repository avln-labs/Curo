const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.ddtlotowrvwvqpygsgmm:Sufiyan11@_@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres' });

async function run() {
  try {
    const res1 = await pool.query(`UPDATE appointments SET meet_link = 'https://meet.google.com/demo-meet-link' WHERE meet_link IS NULL AND consultation_type_id IN (SELECT id FROM consultation_types WHERE type = 'online')`);
    console.log(`Updated ${res1.rowCount} missing meet links.`);
    
    const res2 = await pool.query(`UPDATE appointments SET status = 'completed' WHERE status = 'in_progress' AND slot_date < CURRENT_DATE`);
    console.log(`Marked ${res2.rowCount} stuck in_progress past appointments as completed.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
