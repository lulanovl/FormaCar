exports.seed = async function (knex) {
  await knex('services').del();
  await knex('services').insert([
    { id: 1, name: 'Стандартная мойка',    description: 'Наружная мойка кузова, сушка, чистка дисков и стёкол.',                                  duration_min: 40,  price_som: 0, is_active: true },
    { id: 2, name: 'Трёхфазная мойка',     description: 'Трёхэтапная мойка: предварительная, основная, финальная полировка кузова.',               duration_min: 90,  price_som: 0, is_active: true },
    { id: 3, name: 'Премиум мойка',        description: 'Полный премиальный уход: кузов, салон, химия, ароматизация.',                             duration_min: 180, price_som: 0, is_active: true },
    { id: 4, name: 'Химчистка',            description: 'Глубокая химическая чистка салона. Сиденья, ковры, потолок.',                             duration_min: 300, price_som: 0, is_active: true },
    { id: 5, name: 'Полировка + керамика', description: 'Машинная полировка кузова и нанесение керамического покрытия. Максимальная защита.',      duration_min: 480, price_som: 0, is_active: true },
    { id: 6, name: 'Мойка днища',          description: 'Мойка днища под высоким давлением.',                                                      duration_min: 30,  price_som: 0, is_active: true },
    { id: 7, name: 'Антикор днища',        description: 'Нанесение антикоррозийного покрытия на днище автомобиля.',                                duration_min: 120, price_som: 0, is_active: true },
  ]);
};
