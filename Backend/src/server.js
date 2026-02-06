const app = require('./app');
const { connectDb } = require('./config/db');
const { ensureDefaultRules } = require('./services/reconciliationRules');
const { env } = require('./config/env');

async function start() {
  await connectDb();
  await ensureDefaultRules();
  app.listen(env.PORT, () => {
    console.log(`Server listening on ${env.PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
