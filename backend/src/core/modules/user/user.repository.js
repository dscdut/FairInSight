import prisma from '../../database';

class Repository {
  async findByEmail(email) {
    return prisma.users.findFirst({
      where: {
        email,
        deleted_at: null,
      },
      include: {
        roles: true, // lấy role
      },
    });
  }

  async findById(id) {
    return prisma.users.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        roles: true,
      },
    });
  }
}

export const UserRepository = new Repository();