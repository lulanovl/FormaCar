exports.up = function (knex) {
  return knex.schema.alterTable('orders', (table) => {
    table.integer('final_price').nullable().defaultTo(null);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('orders', (table) => {
    table.dropColumn('final_price');
  });
};
