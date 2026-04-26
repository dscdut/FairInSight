/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

exports.seed = async (knex) => {
  await knex('specialties').del();

  await knex('specialties').insert([
    { id: knex.raw('uuid_generate_v4()'), name: 'Hình sự' },
    { id: knex.raw('uuid_generate_v4()'), name: 'Dân sự' },
    { id: knex.raw('uuid_generate_v4()'), name: 'Doanh nghiệp' },
    { id: knex.raw('uuid_generate_v4()'), name: 'Đất đai' },
  ]);
};
