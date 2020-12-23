import { TENANT_CONNECTION } from '@lib/tenant/const';
import { TenantService } from '@lib/tenant/tenant-service.decorator';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContextIdFactory, ModuleRef, REQUEST } from '@nestjs/core';
import { Connection } from 'typeorm';
import { User } from '../entities/user.entity';
import { Request } from 'express';

@Injectable()
export class UsersService {
  constructor(
    private moduleRef: ModuleRef,
    @Inject(REQUEST) private request: Request,
  ) {}

  async repository() {
    const contextId = ContextIdFactory.getByRequest(this.request);
    this.moduleRef.registerRequestByContextId(this.request, contextId);
    const connection: Connection = await this.moduleRef.resolve(
      TENANT_CONNECTION,
      contextId,
      { strict: false },
    );
    return connection.getRepository(User);
  }

  async assertUsernameAndEmail(options: {
    id?: number;
    email: string;
    username: string;
  }) {
    if (options.email) {
      let userOfEmail: { user };
      try {
        userOfEmail = await this.findByEmail(options);
      } catch (error) {
        userOfEmail = undefined;
      }
      if (userOfEmail && userOfEmail.user.id !== options.id) {
        throw new ConflictException(
          `User with email "${options.email}" is exists`,
        );
      }
    }
    if (options.username) {
      let userOfUsername: { user };
      try {
        userOfUsername = await this.findByUserName(options);
      } catch (error) {
        userOfUsername = undefined;
      }
      if (userOfUsername && userOfUsername.user.id !== options.id) {
        throw new ConflictException(
          `User with username "${options.username}" is exists`,
        );
      }
    }
  }

  async create(options: { item: User }) {
    try {
      await this.assertUsernameAndEmail({
        id: options.item.id,
        email: options.item.email,
        username: options.item.username,
      });
      options.item = await (await this.repository()).save(options.item);
      const { user } = await this.findById({ id: options.item.id });
      return { user };
    } catch (error) {
      throw error;
    }
  }

  async update(options: { id: number; item: User }) {
    try {
      await this.assertUsernameAndEmail({
        id: options.item.id,
        email: options.item.email,
        username: options.item.username,
      });
      options.item.lastLogin = new Date();
      options.item.id = options.id;
      options.item = await (await this.repository()).save(options.item);
      const { user } = await this.findById({ id: options.item.id });
      return { user };
    } catch (error) {
      throw error;
    }
  }

  async delete(options: { id: number }) {
    try {
      let object = await (await this.repository()).findOneOrFail(options.id);
      object.groups = [];
      object = await (await this.repository()).save(object);
      await (await this.repository()).delete(options.id);
      return { user: null };
    } catch (error) {
      throw error;
    }
  }

  async findById(options: { id: number }) {
    try {
      const item = await (await this.repository()).findOneOrFail(options.id, {
        relations: ['groups', 'groups.permissions'],
      });
      return { user: item };
    } catch (error) {
      throw error;
    }
  }

  async findAll(options: {
    curPage: number;
    perPage: number;
    q?: string;
    group?: number;
    sort?: string;
  }) {
    try {
      let qb = (await this.repository()).createQueryBuilder('user');
      if (options.group) {
        qb = qb
          .leftJoinAndSelect('user.groups', 'group')
          .where('group.id = :group', { group: options.group });
      } else {
        qb = qb.leftJoinAndSelect('user.groups', 'group');
        qb = qb.leftJoinAndSelect('group.permissions', 'permission');
        qb = qb.leftJoinAndSelect('permission.contentType', 'contentType');
      }
      if (options.q) {
        qb = qb.where(
          'user.first_name like :q or user.last_name like :q or user.username like :q or user.id = :id',
          {
            q: `%${options.q}%`,
            id: +options.q,
          },
        );
      }
      options.sort =
        options.sort && new User().hasOwnProperty(options.sort.replace('-', ''))
          ? options.sort
          : '-id';
      const field = options.sort.replace('-', '');
      if (options.sort) {
        if (options.sort[0] === '-') {
          qb = qb.orderBy('user.' + field, 'DESC');
        } else {
          qb = qb.orderBy('user.' + field, 'ASC');
        }
      }
      qb = qb
        .skip((options.curPage - 1) * options.perPage)
        .take(options.perPage);
      const objects: [User[], number] = await qb.getManyAndCount();
      return {
        users: objects[0],
        meta: {
          perPage: options.perPage,
          totalPages:
            options.perPage > objects[1]
              ? 1
              : Math.ceil(objects[1] / options.perPage),
          totalResults: objects[1],
          curPage: options.curPage,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(options: { email: string }) {
    try {
      const item = await (await this.repository()).findOneOrFail({
        where: {
          email: options.email,
        },
        relations: ['groups', 'groups.permissions'],
      });
      return {
        user: item,
      };
    } catch (error) {
      throw new NotFoundException(
        `User with email "${options.email}" not founded`,
      );
    }
  }

  async findByUserName(options: { username: string }) {
    try {
      const item = await (await this.repository()).findOneOrFail({
        where: {
          username: options.username,
        },
        relations: ['groups', 'groups.permissions'],
      });
      return {
        user: item,
      };
    } catch (error) {
      throw new NotFoundException(
        `User with username "${options.username}" not founded`,
      );
    }
  }
}
