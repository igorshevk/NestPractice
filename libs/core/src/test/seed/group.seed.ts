import { Group } from '@lib/core/entities/group.entity';
import { Permission } from '@lib/core/entities/permission.entity';
import { User } from '@lib/core/entities/user.entity';
import { plainToClass } from 'class-transformer';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class GroupSeed implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const tempUser = new User();
    const gAdmin = await queryRunner.manager
      .getRepository(Group)
      .findOneOrFail({
        where: {
          name: 'admin',
        },
        relations: ['permissions'],
      });
    const addGroupPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'add_group',
        },
      });
    const changeGroupPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'change_group',
        },
      });
    const deleteGroupPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'delete_group',
        },
      });
    const readGroupPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'read_group',
        },
      });
    const gAddGroup = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'add_group',
          title: 'Add group',
          permissions: [addGroupPermission],
        }),
      );
    const gChangeGroup = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'change_group',
          title: 'Change group',
          permissions: [changeGroupPermission],
        }),
      );
    const gDeleteGroup = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'delete_group',
          title: 'Delete group',
          permissions: [deleteGroupPermission],
        }),
      );
    const gReadGroup = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'read_group',
          title: 'Read group',
          permissions: [readGroupPermission],
        }),
      );
    await queryRunner.manager.getRepository<User>(User).save(
      plainToClass(User, [
        {
          username: 'inactiveAdmin',
          email: 'inactiveAdmin@inactiveAdmin.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'InactiveAdminFirstName',
          lastName: 'InactiveAdminLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gAdmin],
        },
        {
          username: 'addGroupUser',
          email: 'addGroupUser@addGroupUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'AddGroupUserFirstName',
          lastName: 'AddGroupUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gAddGroup],
        },
        {
          username: 'changeGroupUser',
          email: 'changeGroupUser@changeGroupUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'ChangeGroupUserFirstName',
          lastName: 'ChangeGroupUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gChangeGroup],
        },
        {
          username: 'deleteGroupUser',
          email: 'deleteGroupUser@deleteGroupUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'DeleteGroupUserFirstName',
          lastName: 'DeleteGroupUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gDeleteGroup],
        },
        {
          username: 'readGroupUser',
          email: 'readGroupUser@readGroupUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'ReadGroupUserFirstName',
          lastName: 'ReadGroupUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gReadGroup],
        },
      ]),
    );
  }

  /* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
  public async down(_queryRunner: QueryRunner): Promise<any> {}
}
