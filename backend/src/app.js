require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const routes       = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

// Only start the HTTP server when running directly (local dev).
// When Vercel imports this file as a serverless function it just uses
// the exported `app` as a request handler — no listen() needed.
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`FormaCar API running on port ${PORT}`));
}

module.exports = app;
