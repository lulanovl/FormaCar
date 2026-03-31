exports.seed = async function (knex) {
  await knex('car_types').del();
  await knex('car_types').insert([
    { id: 1, name: 'Седан',       icon: '🚗', order_num: 1 },
    { id: 2, name: 'Кроссовер',   icon: '🚙', order_num: 2 },
    { id: 3, name: 'Внедорожник', icon: '🚙', order_num: 3 },
    { id: 4, name: 'Минивэн',     icon: '🚐', order_num: 4 },
  ]);
};
