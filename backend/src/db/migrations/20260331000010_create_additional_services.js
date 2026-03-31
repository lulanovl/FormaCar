exports.up = function (knex) {
  return knex.schema.createTable('additional_services', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('price').notNullable().defaultTo(0);
    table.boolean('is_from_price').defaultTo(false); // true = "от X"
    table.integer('duration_min').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.integer('order_num').defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('additional_services');
};
