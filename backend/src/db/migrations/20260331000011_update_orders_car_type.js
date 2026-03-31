// Добавляем тип кузова и доп. услуги к заказу
exports.up = function (knex) {
  return knex.schema.table('orders', (table) => {
    table.integer('car_type_id').unsigned().nullable().references('id').inTable('car_types');
    table.string('car_type_name');  // snapshot
    table.text('additional_service_ids');  // JSON array of ids, snapshot
    table.integer('extras_price').defaultTo(0); // сумма доп. услуг
  });
};

exports.down = function (knex) {
  return knex.schema.table('orders', (table) => {
    table.dropColumn('car_type_id');
    table.dropColumn('car_type_name');
    table.dropColumn('additional_service_ids');
    table.dropColumn('extras_price');
  });
};
