const knexConfig = require('../../knexfile');

const env = process.env.DATABASE_URL ? 'production' : 'development';
const knex = require('knex')(knexConfig[env]);

module.exports = knex;
