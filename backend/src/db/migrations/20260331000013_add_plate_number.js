exports.up = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.string('plate_number').nullable().defaultTo(null);
  });
  await knex.schema.alterTable('clients', (table) => {
    table.string('plate_number').nullable().defaultTo(null);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropColumn('plate_number');
  });
  await knex.schema.alterTable('clients', (table) => {
    table.dropColumn('plate_number');
  });
};
