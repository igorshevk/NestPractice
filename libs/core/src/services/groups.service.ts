import { TENANT_CONNECTION } from '@lib/tenant/const';
import { TenantService } from '@lib/tenant/tenant-service.decorator';
import { Inject, NotFoundException } from '@nestjs/common';
import { ContextIdFactory, ModuleRef, REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Connection, Repository } from 'typeorm';
import { Group } from '../entities/group.entity';

@TenantService()
export class GroupsService {
  items: Group[];

  constructor(
    private moduleRef: ModuleRef,
    @Inject(REQUEST) private request: Record<string, unknown>,
  ) {}

  async repository() {
    const contextId = ContextIdFactory.getByRequest(this.request);
    this.moduleRef.registerRequestByContextId(this.request, contextId);
    const connection: Connection = await this.moduleRef.resolve(
      TENANT_CONNECTION,
      contextId,
      { strict: false },
    );
    return await connection.getRepository(Group);
  }

  async create(options: { item: Group }) {
    try {
      options.item = await (await this.repository()).save(options.item);
      return { group: options.item };
    } catch (error) {
      throw error;
    }
  }

  async update(options: { id: number; item: Group }) {
    options.item.id = options.id;
    try {
      options.item = await (await this.repository()).save(options.item);
      return { group: options.item };
    } catch (error) {
      throw error;
    }
  }

  async delete(options: { id: number }) {
    try {
      let item = await (await this.repository()).findOneOrFail(options.id);
      item.permissions = [];
      item = await (await this.repository()).save(item);
      await (await this.repository()).delete(options.id);
      return { group: null };
    } catch (error) {
      throw error;
    }
  }

  async findById(options: { id: number }) {
    try {
      const item = await (await this.repository()).findOneOrFail(options.id, {
        relations: ['permissions'],
      });
      return { group: item };
    } catch (error) {
      throw error;
    }
  }

  async findAll(options: {
    curPage: number;
    perPage: number;
    q?: string;
    sort?: string;
  }) {
    try {
      let qb = (await this.repository()).createQueryBuilder('group');
      qb = qb.leftJoinAndSelect('group.permissions', 'permission');
      qb = qb.leftJoinAndSelect('permission.contentType', 'contentType');
      if (options.q) {
        qb = qb.where(
          'group.title like :q or group.name like :q or group.id = :id',
          {
            q: `%${options.q}%`,
            id: +options.q,
          },
        );
      }
      options.sort =
        options.sort &&
        new Group().hasOwnProperty(options.sort.replace('-', ''))
          ? options.sort
          : '-id';
      const field = options.sort.replace('-', '');
      if (options.sort) {
        if (options.sort[0] === '-') {
          qb = qb.orderBy('group.' + field, 'DESC');
        } else {
          qb = qb.orderBy('group.' + field, 'ASC');
        }
      }
      qb = qb
        .skip((options.curPage - 1) * options.perPage)
        .take(options.perPage);
      const objects: [Group[], number] = await qb.getManyAndCount();
      return {
        groups: objects[0],
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

  getGroupByName(options: { name: string }) {
    const groups = (this.items ? this.items : []).filter(
      group => group.name === options.name,
    );
    if (groups.length) {
      return groups[0];
    }
    throw new NotFoundException(`Group with name "${options.name}" not exists`);
  }

  async preloadAll() {
    if (!this.items) {
      try {
        const groups = await (await this.repository())
          .createQueryBuilder('group')
          .leftJoinAndSelect('group.permissions', 'permission')
          .getMany();
        this.items = plainToClass(Group, groups);
        // Logger.log(JSON.stringify(groups.map(group => group.name)), GroupsService.name);
      } catch (error) {
        throw error;
      }
    }
  }
}
