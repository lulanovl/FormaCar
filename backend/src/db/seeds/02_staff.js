/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('staff').del();
  await knex('staff').insert([
    {
      id: 1,
      name: 'Азиз Байсалов',
      role: 'Старший мастер',
      initials: 'АБ',
      status: 'working',
    },
    {
      id: 2,
      name: 'Мирлан Касымов',
      role: 'Мастер детейлинга',
      initials: 'МК',
      status: 'working',
    },
    {
      id: 3,
      name: 'Эрлан Джумабеков',
      role: 'Мастер',
      initials: 'ЭД',
      status: 'break',
    },
  ]);
};
