import { Group } from '@lib/core/entities/group.entity';
import { Permission } from '@lib/core/entities/permission.entity';
import { User } from '@lib/core/entities/user.entity';
import { plainToClass } from 'class-transformer';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserSeed implements MigrationInterface {
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
    const addUserPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'add_user',
        },
      });
    const changeUserPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'change_user',
        },
      });
    const deleteUserPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'delete_user',
        },
      });
    const readUserPermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'read_user',
        },
      });
    const gAddUser = await queryRunner.manager.getRepository<Group>(Group).save(
      plainToClass(Group, {
        name: 'addUser',
        title: 'Add user',
        permissions: [addUserPermission],
      }),
    );
    const gChangeUser = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'change_user',
          title: 'Change user',
          permissions: [changeUserPermission],
        }),
      );
    const gDeleteUser = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'delete_user',
          title: 'Delete user',
          permissions: [deleteUserPermission],
        }),
      );
    const gReadUser = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'read_user',
          title: 'Read user',
          permissions: [readUserPermission],
        }),
      );
    await queryRunner.manager.getRepository<User>(User).save(
      plainToClass(User, [
        {
          username: 'user6',
          email: 'user6@user6.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'User6FirstName',
          lastName: 'User6LastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gAdmin],
        },
        {
          username: 'addUser',
          email: 'addUser@addUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'AddUserFirstName',
          lastName: 'AddUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gAddUser],
        },
        {
          username: 'changeUser',
          email: 'changeUser@changeUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'ChangeUserFirstName',
          lastName: 'ChangeUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gChangeUser],
        },
        {
          username: 'deleteUser',
          email: 'deleteUser@deleteUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'DeleteUserFirstName',
          lastName: 'DeleteUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gDeleteUser],
        },
        {
          username: 'readUser',
          email: 'readUser@readUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'ReadUserFirstName',
          lastName: 'ReadUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gReadUser],
        },
      ]),
    );
  }

  /* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
  public async down(_queryRunner: QueryRunner): Promise<any> {}
}
