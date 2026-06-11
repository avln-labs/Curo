import app from './app';
import { env } from './shared/env';

const port = env.PORT;

app.listen(port, () => {
  console.log(`CURO backend is running on http://localhost:${port}`);
});
