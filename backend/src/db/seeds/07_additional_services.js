exports.seed = async function (knex) {
  await knex('additional_services').del();
  await knex('additional_services').insert([
    { id: 1, name: 'Антидождь',                price: 3000, is_from_price: true,  duration_min: 20, is_active: true, order_num: 1 },
    { id: 2, name: 'Чистка дисков',            price: 3000, is_from_price: true,  duration_min: 30, is_active: true, order_num: 2 },
    { id: 3, name: 'Антибитум',                price: 3000, is_from_price: true,  duration_min: 20, is_active: true, order_num: 3 },
    { id: 4, name: 'Сухой туман',              price: 1500, is_from_price: false, duration_min: 40, is_active: true, order_num: 4 },
    { id: 5, name: 'Подкапотное пространство', price: 2000, is_from_price: false, duration_min: 30, is_active: true, order_num: 5 },
  ]);
};
