/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('staff', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('role');
    table.string('initials', 3);
    table.string('status').defaultTo('working'); // working | break | off
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('staff');
};
