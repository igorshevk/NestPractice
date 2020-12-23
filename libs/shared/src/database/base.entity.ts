import {
  CreateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn()
  created!: Date;

  @UpdateDateColumn()
  updated!: Date;

  @DeleteDateColumn()
  deleted: Date;

  @VersionColumn()
  version: number;
}
