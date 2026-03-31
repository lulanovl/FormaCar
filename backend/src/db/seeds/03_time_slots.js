/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('time_slots').del();

  const slots = [];
  for (let hour = 9; hour <= 19; hour++) {
    slots.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      is_active: true,
    });
  }

  await knex('time_slots').insert(slots);
};
