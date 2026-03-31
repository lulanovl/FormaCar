exports.up = function (knex) {
  return knex.schema.createTable('car_types', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();   // Седан, Кроссовер, ...
    table.string('icon');                 // 🚗 🚙 ...
    table.integer('order_num').defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('car_types');
};
