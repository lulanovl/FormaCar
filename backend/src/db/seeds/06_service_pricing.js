// Матрица цен: service_id × car_type_id
// Services: 1=Стандартная, 2=Трёхфазная, 3=Премиум, 4=Химчистка,
//           5=Полировка+керамика, 6=Мойка днища, 7=Антикор днища
// Car types: 1=Седан, 2=Кроссовер, 3=Внедорожник, 4=Минивэн

exports.seed = async function (knex) {
  await knex('service_pricing').del();

  await knex('service_pricing').insert([
    // Стандартная мойка
    { service_id: 1, car_type_id: 1, price: 1000, is_from_price: false },
    { service_id: 1, car_type_id: 2, price: 1100, is_from_price: false },
    { service_id: 1, car_type_id: 3, price: 1300, is_from_price: false },
    { service_id: 1, car_type_id: 4, price: 1500, is_from_price: false },

    // Трёхфазная мойка
    { service_id: 2, car_type_id: 1, price: 2200, is_from_price: false },
    { service_id: 2, car_type_id: 2, price: 2300, is_from_price: false },
    { service_id: 2, car_type_id: 3, price: 2500, is_from_price: false },
    { service_id: 2, car_type_id: 4, price: 2700, is_from_price: false },

    // Премиум мойка
    { service_id: 3, car_type_id: 1, price: 5000, is_from_price: false },
    { service_id: 3, car_type_id: 2, price: 6000, is_from_price: false },
    { service_id: 3, car_type_id: 3, price: 7000, is_from_price: false },
    { service_id: 3, car_type_id: 4, price: 8000, is_from_price: false },

    // Химчистка — одинаковая цена, но "от"
    { service_id: 4, car_type_id: 1, price: 10000, is_from_price: true },
    { service_id: 4, car_type_id: 2, price: 10000, is_from_price: true },
    { service_id: 4, car_type_id: 3, price: 10000, is_from_price: true },
    { service_id: 4, car_type_id: 4, price: 10000, is_from_price: true },

    // Полировка + керамика
    { service_id: 5, car_type_id: 1, price: 17000, is_from_price: false },
    { service_id: 5, car_type_id: 2, price: 17000, is_from_price: false },
    { service_id: 5, car_type_id: 3, price: 17000, is_from_price: false },
    { service_id: 5, car_type_id: 4, price: 17000, is_from_price: false },

    // Мойка днища
    { service_id: 6, car_type_id: 1, price: 2000, is_from_price: false },
    { service_id: 6, car_type_id: 2, price: 2000, is_from_price: false },
    { service_id: 6, car_type_id: 3, price: 2000, is_from_price: false },
    { service_id: 6, car_type_id: 4, price: 2000, is_from_price: false },

    // Антикор днища
    { service_id: 7, car_type_id: 1, price: 25000, is_from_price: true },
    { service_id: 7, car_type_id: 2, price: 25000, is_from_price: true },
    { service_id: 7, car_type_id: 3, price: 25000, is_from_price: true },
    { service_id: 7, car_type_id: 4, price: 25000, is_from_price: true },
  ]);
};
