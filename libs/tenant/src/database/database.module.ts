import { forwardRef, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from './database.entity';
import { TenantModule } from '../tenant.module';

@Module({
  imports: [
    forwardRef(() => TenantModule),
    TypeOrmModule.forFeature([DatabaseEntity]),
  ],
  providers: [DatabaseService],
  controllers: [DatabaseController],
})
export class DatabaseModule {}
