/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('clients', (table) => {
    table.increments('id').primary();
    table.string('name');
    table.string('phone').unique();
    table.string('car');
    table.integer('total_visits').defaultTo(0);
    table.string('last_visit'); // YYYY-MM-DD
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('clients');
};
