import { Inject } from '@nestjs/common';
import { Connection } from 'typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { TENANT_CONNECTION } from '@lib/tenant/const';
import { TenantService } from '../tenant-service.decorator';
import { DatabaseEntity } from './database.entity';

@TenantService()
export class DatabaseService extends TypeOrmCrudService<DatabaseEntity> {
  constructor(@Inject(TENANT_CONNECTION) private connection: Connection) {
    super(connection.getRepository(DatabaseEntity));
  }
}
