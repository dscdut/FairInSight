import prisma from '../database';

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, include = null) {
    return prisma[this.model].findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include,
    });
  }

  async findOne(where, include = null) {
    return prisma[this.model].findFirst({
      where: {
        ...where,
        deleted_at: null,
      },
      include,
    });
  }

  async findMany(where = {}, include = null, orderBy = { created_at: 'desc' }) {
    return prisma[this.model].findMany({
      where: {
        ...where,
        deleted_at: null,
      },
      include,
      orderBy,
    });
  }

  async create(data) {
    return prisma[this.model].create({
      data,
    });
  }

  async update(id, data) {
    return prisma[this.model].update({
      where: { id },
      data,
    });
  }

  async softDelete(id) {
    return prisma[this.model].update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async hardDelete(id) {
    return prisma[this.model].delete({
      where: { id },
    });
  }

  async count(where = {}) {
    return prisma[this.model].count({
      where: {
        ...where,
        deleted_at: null,
      },
    });
  }
}
