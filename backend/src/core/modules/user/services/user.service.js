import { BcryptService } from 'core/modules/auth';
import prisma from 'core/database';
import { Optional } from 'core/utils';
import { NotFoundException, DuplicateException, BadRequestException } from 'packages/httpException';
import { UserRepository } from '../user.repository';
import { RoleRepository } from '../../role/role.repository';

class Service {
  constructor() {
    this.repository = UserRepository;
    this.roleRepository = RoleRepository;
    this.bcryptService = BcryptService;
  }

  async createOne(createUserDto) {
    const existingUser = await this.repository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new DuplicateException('Email is being used');
    }

    if (createUserDto.password !== createUserDto.confirm_password) {
      throw new BadRequestException('Password does not match');
    }

    const passwordHash = this.bcryptService.hash(createUserDto.password);
    const userRole = await this.roleRepository.findByName('USER');

    try {
      const { confirm_password, password, ...userData } = createUserDto;
      const createdUser = await this.repository.create({
        ...userData,
        password_hash: passwordHash,
        role_id: userRole ? userRole.id : null,
      });

      return createdUser;
    } catch (error) {
      console.error('UserService.createOne error:', error);
      throw error;
    }
  }

  async findById(id) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

export const UserService = new Service();

