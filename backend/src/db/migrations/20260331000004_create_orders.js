/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table.string('order_number').unique();
    table.string('client_name');
    table.string('client_phone');
    table.string('client_car');
    table.integer('service_id').unsigned().references('id').inTable('services');
    table.string('service_name'); // snapshot at time of booking
    table.string('date'); // YYYY-MM-DD
    table.string('time_slot');
    table.string('status').defaultTo('new'); // new|confirmed|wip|done|rejected|no_show
    table.integer('price_snapshot');
    table.text('note');
    table.integer('staff_id').unsigned().nullable().references('id').inTable('staff');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('orders');
};
