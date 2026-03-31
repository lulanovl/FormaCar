/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('order_checklist', (table) => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('checklist_item_id').unsigned().references('id').inTable('checklist_items');
    table.boolean('is_checked').defaultTo(false);
    table.datetime('checked_at').nullable();
    table.string('checked_by').nullable();
    table.text('note').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_checklist');
};
