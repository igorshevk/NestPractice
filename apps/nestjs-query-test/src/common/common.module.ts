import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseEntity } from '../tenant/database/database.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseEntity])],
})
export class CommonModule {}
