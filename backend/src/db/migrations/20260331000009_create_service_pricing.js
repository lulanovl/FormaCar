// Матрица цен: service × car_type → price
exports.up = function (knex) {
  return knex.schema.createTable('service_pricing', (table) => {
    table.increments('id').primary();
    table.integer('service_id').unsigned().notNullable().references('id').inTable('services');
    table.integer('car_type_id').unsigned().notNullable().references('id').inTable('car_types');
    table.integer('price').notNullable().defaultTo(0);
    table.boolean('is_from_price').defaultTo(false); // true = "от X"
    table.unique(['service_id', 'car_type_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('service_pricing');
};
