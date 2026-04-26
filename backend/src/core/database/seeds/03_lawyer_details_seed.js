/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

exports.seed = async (knex) => {
  await knex('lawyer_details').del();

  const lawyerUser = await knex('users')
    .where('email', 'lawyer@gmail.com')
    .first();

  await knex('lawyer_details').insert({
    user_id: lawyerUser.id,
    bio: 'Luật sư chuyên về dân sự và doanh nghiệp',
    experience_years: 5,
    is_verified: true,
    rating_avg: 4.5,
    price_per_hour: 50,
    status: 'AVAILABLE',
    bar_association: 'Vietnam Bar Federation',
    license_number: 'LAW123456',
  });
};
