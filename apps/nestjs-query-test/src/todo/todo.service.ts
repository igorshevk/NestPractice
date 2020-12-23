import { QueryService } from '@nestjs-query/core';
import { TypeOrmQueryService } from '@nestjs-query/query-typeorm';
import { Inject } from '@nestjs/common';
import { TENANT_CONNECTION } from '../tenant/const';
import { TenantService } from '../tenant/tenant-service.decorator';
import { Connection } from 'typeorm';
import { TodoEntity } from './todo.entity';

@QueryService(TodoEntity)
@TenantService()
export class TodoItemService extends TypeOrmQueryService<TodoEntity> {
  constructor(@Inject(TENANT_CONNECTION) private connection: Connection) {
    super(connection.getRepository(TodoEntity));
  }
}
