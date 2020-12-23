import { Inject } from '@nestjs/common';
import { Connection } from 'typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { TENANT_CONNECTION } from '@lib/tenant/const';
import { TenantEntity } from './tenant.entity';
import { TenantService } from './tenant-service.decorator';

@TenantService()
export class TenantServicez extends TypeOrmCrudService<TenantEntity> {
  constructor(@Inject(TENANT_CONNECTION) private connection: Connection) {
    super(connection.getRepository(TenantEntity));
  }
}
