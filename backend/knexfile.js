require('dotenv').config();

const config = {
  client: 'sqlite3',
  connection: {
    filename: process.env.DB_PATH || './data/formacar.db',
  },
  useNullAsDefault: true,
  migrations: {
    directory: './src/db/migrations',
  },
  seeds: {
    directory: './src/db/seeds',
  },
};

module.exports = {
  development: config,
  production: config,
};
