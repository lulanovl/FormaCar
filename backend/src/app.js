require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Ensure data directory exists
const dataDir = path.resolve(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : './data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// Mount all routes under /api
app.use('/api', routes);

// Serve frontend static build if it exists
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  console.warn('Frontend dist not found, skipping static asset serving:', frontendDist);
}

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FormaCar API running on port ${PORT}`);
});

module.exports = app;
