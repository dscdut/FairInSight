/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */

const bcrypt = require('bcrypt');

exports.seed = async (knex) => {
  await knex('users').del();

  const roles = await knex('roles').select('*');

  const userRole = roles.find(r => r.name === 'USER');
  const lawyerRole = roles.find(r => r.name === 'LAWYER');
  const adminRole = roles.find(r => r.name === 'ADMIN');

  const password = bcrypt.hashSync('123456', 10);

  await knex('users').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'user@gmail.com',
      password_hash: password,
      full_name: 'Normal User',
      role_id: userRole.id,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'lawyer@gmail.com',
      password_hash: password,
      full_name: 'Lawyer User',
      role_id: lawyerRole.id,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'admin@gmail.com',
      password_hash: password,
      full_name: 'Admin User',
      role_id: adminRole.id,
    },
  ]);
};