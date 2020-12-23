import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql';
import { NestjsQueryTypeOrmModule } from '@nestjs-query/query-typeorm';
import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { TodoItemDTO } from './todo.dto';
import { TodoEntity } from './todo.entity';
import { TodoItemService } from './todo.service';

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      // import the NestjsQueryTypeOrmModule to register the entity with typeorm
      // and provide a QueryService
      imports: [
        NestjsQueryTypeOrmModule.forFeature([TodoEntity]),
        TenantModule,
      ],
      services: [TodoItemService],
      // describe the resolvers you want to expose
      resolvers: [
        {
          DTOClass: TodoItemDTO,
          EntityClass: TodoEntity,
          ServiceClass: TodoItemService,
        },
      ],
    }),
  ],
})
export class TodoItemModule {}
