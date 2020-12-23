import { TENANT_CONNECTION } from '@lib/tenant/const';
import { TenantService } from '@lib/tenant/tenant-service.decorator';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { ContentType } from '../entities/content-type.entity';

@TenantService()
export class ContentTypesService {
  private readonly repository: Repository<ContentType>;

  constructor(@Inject(TENANT_CONNECTION) private connection: Connection) {
    this.repository = this.connection.getRepository(ContentType);
  }

  async create(options: { item: ContentType }) {
    try {
      options.item = await this.repository.save(options.item);
      return { contentType: options.item };
    } catch (error) {
      throw error;
    }
  }

  async update(options: { id: number; item: ContentType }) {
    options.item.id = options.id;
    try {
      options.item = await this.repository.save(options.item);
      return { contentType: options.item };
    } catch (error) {
      throw error;
    }
  }

  async delete(options: { id: number }) {
    try {
      let item = await this.repository.findOneOrFail(options.id, {
        relations: ['permissions'],
      });
      item.permissions = [];
      item = await this.repository.save(item);
      await this.repository.delete(options.id);
      return { contentType: null };
    } catch (error) {
      throw error;
    }
  }

  async findById(options: { id: number }) {
    try {
      const item = await this.repository.findOneOrFail(options.id, {
        relations: ['permissions'],
      });
      return { contentType: item };
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
      let qb = this.repository.createQueryBuilder('contentType');
      if (options.q) {
        qb = qb.where(
          'contentType.name like :q or contentType.title like :q or contentType.id = :id',
          {
            q: `%${options.q}%`,
            id: +options.q,
          },
        );
      }
      options.sort =
        options.sort &&
        new ContentType().hasOwnProperty(options.sort.replace('-', ''))
          ? options.sort
          : '-id';
      const field = options.sort.replace('-', '');
      if (options.sort)
        if (options.sort[0] === '-') {
          qb = qb.orderBy('contentType.' + field, 'DESC');
        } else {
          qb = qb.orderBy('contentType.' + field, 'ASC');
        }
      qb = qb
        .skip((options.curPage - 1) * options.perPage)
        .take(options.perPage);
      const objects: [ContentType[], number] = await qb.getManyAndCount();
      return {
        contentTypes: objects[0],
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
}
