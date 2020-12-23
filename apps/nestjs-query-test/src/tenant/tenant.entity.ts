import { BaseEntity } from '../common/database/base.entity';
import { VarcharLength } from '../common/database/const';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DatabaseEntity } from './database/database.entity';

@Entity('tenant')
export class TenantEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({
    type: 'varchar',
    length: VarcharLength.TINY,
    comment: 'This will be the url in case host not setted',
    nullable: false,
    unique: true,
  })
  path!: string;

  @Column({
    type: 'varchar',
    length: VarcharLength.TINY,
    comment: 'User can register a host',
    nullable: true,
    unique: true,
  })
  host: string;

  @Column({
    type: 'varchar',
    length: VarcharLength.MEDIUM,
    comment: "Company's name",
    nullable: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: VarcharLength.MEDIUM,
    comment: "Company's description",
    nullable: true,
  })
  description!: string;

  @OneToOne(() => DatabaseEntity)
  @JoinColumn()
  database: DatabaseEntity;
}
