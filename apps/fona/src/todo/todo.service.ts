import { Inject } from '@nestjs/common';
import { TenantService } from '@lib/tenant/tenant-service.decorator';
import { Connection } from 'typeorm';
import { TodoEntity } from './todo.entity';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { TENANT_CONNECTION } from '@lib/tenant/const';

@TenantService()
export class TodoService extends TypeOrmCrudService<TodoEntity> {
  constructor(@Inject(TENANT_CONNECTION) private connection: Connection) {
    super(connection.getRepository(TodoEntity));
  }
}
