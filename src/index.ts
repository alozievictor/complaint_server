import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './database/connect.js';

await connectDatabase();

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`LCOCMS server listening on port ${env.PORT}`);
});
