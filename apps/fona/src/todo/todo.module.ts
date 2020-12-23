import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantModule } from '@lib/tenant';
import { DatabaseEntity } from '@lib/tenant/database/database.entity';
import { TenantEntity } from '@lib/tenant/tenant.entity';
import { TodoController } from './todo.controller';
import { TodoEntity } from './todo.entity';
import { TodoService } from './todo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoEntity, TenantEntity, DatabaseEntity]),
    TenantModule,
  ],
  providers: [TodoService],
  exports: [TodoService],
  controllers: [TodoController],
})
export class TodoModule {}
