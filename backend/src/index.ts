import app from './app';
import { env } from './shared/env';
import { testConnection } from './shared/database';

const port = env.PORT;

app.listen(port, async () => {
  console.log(`\n🚀 CURO backend running on http://localhost:${port}`);
  console.log(`   Mode: ${env.NODE_ENV}  |  OTP provider: ${env.OTP_PROVIDER}\n`);
  await testConnection();
});
