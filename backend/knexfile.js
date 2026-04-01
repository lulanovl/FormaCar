require('dotenv').config();
const path = require('path');

const defaultDbPath = path.resolve(__dirname, 'data', 'formacar.db');
const config = {
  client: 'sqlite3',
  connection: {
    filename: process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'src', 'db', 'migrations'),
  },
  seeds: {
    directory: path.resolve(__dirname, 'src', 'db', 'seeds'),
  },
};

module.exports = {
  development: config,
  production: config,
};
