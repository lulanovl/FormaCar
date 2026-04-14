require('dotenv').config();
const path = require('path');

const devConfig = {
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'data', 'formacar.db'),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'src', 'db', 'migrations'),
  },
  seeds: {
    directory: path.resolve(__dirname, 'src', 'db', 'seeds'),
  },
};

const prodConfig = {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  migrations: {
    directory: path.resolve(__dirname, 'src', 'db', 'migrations'),
  },
  seeds: {
    directory: path.resolve(__dirname, 'src', 'db', 'seeds'),
  },
};

module.exports = {
  development: devConfig,
  production:  prodConfig,
};
