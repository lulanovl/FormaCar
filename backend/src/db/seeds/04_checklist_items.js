/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('checklist_items').del();

  await knex('checklist_items').insert([
    // Кузов (6 items)
    { id: 1,  title: 'Кузов — нет разводов и потёков',            category: 'Кузов',                 order_num: 1,  is_active: true },
    { id: 2,  title: 'Пороги и нижние молдинги чистые',           category: 'Кузов',                 order_num: 2,  is_active: true },
    { id: 3,  title: 'Арки колёс очищены от грязи',               category: 'Кузов',                 order_num: 3,  is_active: true },
    { id: 4,  title: 'Диски и колёсные колпаки чистые',           category: 'Кузов',                 order_num: 4,  is_active: true },
    { id: 5,  title: 'Бамперы (передний и задний) — без грязи',   category: 'Кузов',                 order_num: 5,  is_active: true },
    { id: 6,  title: 'Капот и крышка багажника — без следов',     category: 'Кузов',                 order_num: 6,  is_active: true },

    // Стёкла и зеркала (4 items)
    { id: 7,  title: 'Лобовое стекло — без разводов',             category: 'Стёкла и зеркала',      order_num: 7,  is_active: true },
    { id: 8,  title: 'Заднее стекло — без разводов',              category: 'Стёкла и зеркала',      order_num: 8,  is_active: true },
    { id: 9,  title: 'Боковые стёкла чистые с обеих сторон',      category: 'Стёкла и зеркала',      order_num: 9,  is_active: true },
    { id: 10, title: 'Боковые зеркала чистые',                    category: 'Стёкла и зеркала',      order_num: 10, is_active: true },

    // Салон (6 items)
    { id: 11, title: 'Пол и коврики пропылесосены',               category: 'Салон',                 order_num: 11, is_active: true },
    { id: 12, title: 'Сиденья — нет загрязнений',                 category: 'Салон',                 order_num: 12, is_active: true },
    { id: 13, title: 'Торпедо и приборная панель протёрты',        category: 'Салон',                 order_num: 13, is_active: true },
    { id: 14, title: 'Дверные карты чистые',                      category: 'Салон',                 order_num: 14, is_active: true },
    { id: 15, title: 'Потолок — нет пятен',                       category: 'Салон',                 order_num: 15, is_active: true },
    { id: 16, title: 'Салон ароматизирован',                      category: 'Салон',                 order_num: 16, is_active: true },

    // Финальная инспекция (4 items)
    { id: 17, title: 'Осмотр кузова под углом (блики) — нет разводов', category: 'Финальная инспекция', order_num: 17, is_active: true },
    { id: 18, title: 'Следов химии на лакокрасочном покрытии нет',     category: 'Финальная инспекция', order_num: 18, is_active: true },
    { id: 19, title: 'Резиновые уплотнители протёрты',                 category: 'Финальная инспекция', order_num: 19, is_active: true },
    { id: 20, title: 'Общий внешний вид — готово к выдаче клиенту',    category: 'Финальная инспекция', order_num: 20, is_active: true },
  ]);
};
