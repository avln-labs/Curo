import { PrescriptionsService } from './src/prescriptions/service';
import { db } from './src/shared/database';

async function test() {
  try {
    const rx = await db.queryOne<{ id: string }>(`SELECT id FROM prescriptions LIMIT 1`);
    if (!rx) {
      console.log('No prescriptions found');
      return;
    }
    console.log('Testing PDF for prescription', rx.id);
    const buf = await PrescriptionsService.generatePdfBuffer(rx.id);
    console.log('PDF Generated, buffer length:', buf?.length);
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    process.exit(0);
  }
}
test();
