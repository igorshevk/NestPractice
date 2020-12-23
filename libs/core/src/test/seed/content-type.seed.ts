import { Group } from '@lib/core/entities/group.entity';
import { Permission } from '@lib/core/entities/permission.entity';
import { User } from '@lib/core/entities/user.entity';
import { plainToClass } from 'class-transformer';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContentTypeSeed implements MigrationInterface {
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
    const addContentTypePermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'add_content-type',
        },
      });
    const changeContentTypePermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'change_content-type',
        },
      });
    const deleteContentTypePermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'delete_content-type',
        },
      });
    const readContentTypePermission = await queryRunner.manager
      .getRepository(Permission)
      .findOneOrFail({
        where: {
          name: 'read_content-type',
        },
      });
    const gAddPermission = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'add_content-type',
          title: 'Add permission',
          permissions: [addContentTypePermission],
        }),
      );
    const gChangePermission = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'change_content-type',
          title: 'Change permission',
          permissions: [changeContentTypePermission],
        }),
      );
    const gDeletePermission = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'delete_content-type',
          title: 'Delete permission',
          permissions: [deleteContentTypePermission],
        }),
      );
    const gReadPermission = await queryRunner.manager
      .getRepository<Group>(Group)
      .save(
        plainToClass(Group, {
          name: 'read_content-type',
          title: 'Read permission',
          permissions: [readContentTypePermission],
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
          username: 'addContentTypeUser',
          email: 'addContentTypeUser@addContentTypeUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'AddContentTypeUserFirstName',
          lastName: 'AddContentTypeUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gAddPermission],
        },
        {
          username: 'changeContentTypeUser',
          email: 'changeContentTypeUser@changeContentTypeUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'ChangeContentTypeUserFirstName',
          lastName: 'ChangeContentTypeUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gChangePermission],
        },
        {
          username: 'deleteContentTypeUser',
          email: 'deleteContentTypeUser@deleteContentTypeUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'DeleteContentTypeUserFirstName',
          lastName: 'DeleteContentTypeUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gDeletePermission],
        },
        {
          username: 'readContentTypeUser',
          email: 'readContentTypeUser@readContentTypeUser.com',
          password: await tempUser.createPassword('12345678'),
          firstName: 'ReadContentTypeUserFirstName',
          lastName: 'ReadContentTypeUserLastName',
          isSuperuser: false,
          isStaff: false,
          isActive: false,
          groups: [gReadPermission],
        },
      ]),
    );
  }

  /* eslint-disable @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars */
  public async down(_queryRunner: QueryRunner): Promise<any> {}
}
