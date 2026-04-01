/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Clear order_checklist first (FK dependency), then checklist_items
  await knex('order_checklist').del();
  await knex('checklist_items').del();

  await knex('checklist_items').insert([
    // Кузов (10 items)
    { id: 1,  title: 'Арки колёс, подкрыльники',                                       category: 'Кузов',               order_num: 1,  is_active: true },
    { id: 2,  title: 'Под порогами, под бамперами',                                    category: 'Кузов',               order_num: 2,  is_active: true },
    { id: 3,  title: 'Проверить грязь морды машины',                                   category: 'Кузов',               order_num: 3,  is_active: true },
    { id: 4,  title: 'Диски',                                                           category: 'Кузов',               order_num: 4,  is_active: true },
    { id: 5,  title: 'Почистить шины (специальной щёткой)',                             category: 'Кузов',               order_num: 5,  is_active: true },
    { id: 6,  title: 'Прострелять 4 арки',                                             category: 'Кузов',               order_num: 6,  is_active: true },
    { id: 7,  title: 'Все резинки (двери, уплотнители, багажник, капот)',               category: 'Кузов',               order_num: 7,  is_active: true },
    { id: 8,  title: 'Шланг и между дверью и стойкой',                                 category: 'Кузов',               order_num: 8,  is_active: true },
    { id: 9,  title: 'Замок багажника (если в масле — не трогать)',                     category: 'Кузов',               order_num: 9,  is_active: true },
    { id: 10, title: 'Почистить крышку бензобака изнутри',                              category: 'Кузов',               order_num: 10, is_active: true },

    // Подкапотное (2 items)
    { id: 11, title: 'Под капотом — пространство (материал на самом капоте)',           category: 'Подкапотное',         order_num: 11, is_active: true },
    { id: 12, title: 'Если капот грязный — спросить хозяина: мыть трансбоем или нет',  category: 'Подкапотное',         order_num: 12, is_active: true },

    // Стёкла и зеркала (3 items)
    { id: 13, title: 'Стёкла — нет разводов (лобовое, боковые, заднее)',               category: 'Стёкла и зеркала',   order_num: 13, is_active: true },
    { id: 14, title: 'Боковые зеркала, зеркало заднего вида — без разводов',           category: 'Стёкла и зеркала',   order_num: 14, is_active: true },
    { id: 15, title: 'Прострелять боковые зеркала воздухом',                           category: 'Стёкла и зеркала',   order_num: 15, is_active: true },
    { id: 16, title: 'Люк, панорамная крыша (если есть)',                              category: 'Стёкла и зеркала',   order_num: 16, is_active: true },

    // Салон (11 items)
    { id: 17, title: 'Рельсы под сиденьями',                                           category: 'Салон',               order_num: 17, is_active: true },
    { id: 18, title: 'Ремень безопасности (полностью)',                                 category: 'Салон',               order_num: 18, is_active: true },
    { id: 19, title: 'Педали (чернителем)',                                             category: 'Салон',               order_num: 19, is_active: true },
    { id: 20, title: 'Козырьки, зеркало (в салоне)',                                   category: 'Салон',               order_num: 20, is_active: true },
    { id: 21, title: 'Ковролин (зона педалей)',                                         category: 'Салон',               order_num: 21, is_active: true },
    { id: 22, title: 'Полка за задними сиденьями',                                     category: 'Салон',               order_num: 22, is_active: true },
    { id: 23, title: 'Ручки в салоне на потолке, за ручками',                          category: 'Салон',               order_num: 23, is_active: true },
    { id: 24, title: 'Багажник (внутри)',                                               category: 'Салон',               order_num: 24, is_active: true },
    { id: 25, title: 'Под подголовниками',                                              category: 'Салон',               order_num: 25, is_active: true },
    { id: 26, title: 'Щиток приборов (спидометр)',                                     category: 'Салон',               order_num: 26, is_active: true },
    { id: 27, title: 'Обдув печки на торпеде (воздухоотводники)',                      category: 'Салон',               order_num: 27, is_active: true },

    // Финальная инспекция (1 item)
    { id: 28, title: 'Накидки на руль, бумажки на ноги, парфюм на руль, наклейки (Не открывать окна 1 час)', category: 'Финальная инспекция', order_num: 28, is_active: true },
  ]);
};
