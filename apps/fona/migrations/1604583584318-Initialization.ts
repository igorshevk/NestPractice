import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initialization1604583584318 implements MigrationInterface {
  name = 'Initialization1604583584318';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "todo" ("created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "deleted" TIMESTAMP, "version" integer NOT NULL, "id" SERIAL NOT NULL, "title" character varying NOT NULL, "completed" boolean NOT NULL, CONSTRAINT "PK_d429b7114371f6a35c5cb4776a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "password" character varying(128) NOT NULL, "last_login" TIMESTAMP DEFAULT now(), "is_superuser" boolean NOT NULL DEFAULT false, "username" character varying(150) NOT NULL, "first_name" character varying(30), "last_name" character varying(30), "email" character varying(254) NOT NULL, "is_staff" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT false, "date_joined" TIMESTAMP NOT NULL DEFAULT now(), "date_of_birth" TIMESTAMP, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "groups" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "title" character varying(255) NOT NULL, CONSTRAINT "UQ_664ea405ae2a10c264d582ee563" UNIQUE ("name"), CONSTRAINT "UQ_6b70c09fbdab1399c207d91f410" UNIQUE ("title"), CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "title" character varying(255) NOT NULL, "content_type_id" integer, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "content_types" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "title" character varying(255) NOT NULL, CONSTRAINT "PK_ce94145fcda04af3b3153f44f2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "database" ("created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "deleted" TIMESTAMP, "version" integer NOT NULL, "id" SERIAL NOT NULL, "type" character varying NOT NULL, "host" character varying(15), "port" integer, "username" character varying(15) NOT NULL, "password" character varying(15), "database" character varying(15) NOT NULL, CONSTRAINT "PK_ef0ad4a88bc632fd4d6a0b09ddf" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tenant" ("created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "deleted" TIMESTAMP, "version" integer NOT NULL, "id" SERIAL NOT NULL, "path" character varying(15) NOT NULL, "host" character varying(15), "name" character varying(127) NOT NULL, "description" character varying(127), "databaseId" integer, CONSTRAINT "UQ_5b5c77ec7956f1b9877e6077ce0" UNIQUE ("path"), CONSTRAINT "UQ_a1115a77e94d4226e25a9cbfc2e" UNIQUE ("host"), CONSTRAINT "UQ_56211336b5ff35fd944f2259173" UNIQUE ("name"), CONSTRAINT "REL_a2f4c5f98bce39f6c931b65922" UNIQUE ("databaseId"), CONSTRAINT "PK_da8c6efd67bb301e810e56ac139" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "oauth_tokens_accesstokens" ("id" SERIAL NOT NULL, "provider" character varying(20) NOT NULL, "provider_client_id" character varying(200) NOT NULL, "granted_at" TIMESTAMP NOT NULL DEFAULT now(), "access_token" character varying(500) NOT NULL, "refresh_token" character varying(200), "expires_at" TIMESTAMP, "token_type" character varying(200), "scope" character varying(512), "user_id" integer, CONSTRAINT "PK_d31a29cc78dc21690d9b633ab11" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_groups" ("user_id" integer NOT NULL, "group_id" integer NOT NULL, CONSTRAINT "PK_c95039f66f5d7a452fc53945bfe" PRIMARY KEY ("user_id", "group_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_95bf94c61795df25a515435010" ON "user_groups" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c5f2c23c34f3921fbad2cd394" ON "user_groups" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "group_permissions" ("group_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_b0f1de027a85442d3c1e8bd0ff5" PRIMARY KEY ("group_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3924be6485a5b5d0d2fe1a94c0" ON "group_permissions" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7514fdc446a1fdcf5b2d39cda6" ON "group_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD CONSTRAINT "FK_957411736adcb472de3250f0608" FOREIGN KEY ("content_type_id") REFERENCES "content_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" ADD CONSTRAINT "FK_a2f4c5f98bce39f6c931b659220" FOREIGN KEY ("databaseId") REFERENCES "database"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_tokens_accesstokens" ADD CONSTRAINT "FK_8841999c8919da8b6c46cfff756" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD CONSTRAINT "FK_95bf94c61795df25a5154350102" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" ADD CONSTRAINT "FK_4c5f2c23c34f3921fbad2cd3940" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_permissions" ADD CONSTRAINT "FK_3924be6485a5b5d0d2fe1a94c08" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_permissions" ADD CONSTRAINT "FK_7514fdc446a1fdcf5b2d39cda60" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "group_permissions" DROP CONSTRAINT "FK_7514fdc446a1fdcf5b2d39cda60"`,
    );
    await queryRunner.query(
      `ALTER TABLE "group_permissions" DROP CONSTRAINT "FK_3924be6485a5b5d0d2fe1a94c08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" DROP CONSTRAINT "FK_4c5f2c23c34f3921fbad2cd3940"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_groups" DROP CONSTRAINT "FK_95bf94c61795df25a5154350102"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_tokens_accesstokens" DROP CONSTRAINT "FK_8841999c8919da8b6c46cfff756"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tenant" DROP CONSTRAINT "FK_a2f4c5f98bce39f6c931b659220"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP CONSTRAINT "FK_957411736adcb472de3250f0608"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_7514fdc446a1fdcf5b2d39cda6"`);
    await queryRunner.query(`DROP INDEX "IDX_3924be6485a5b5d0d2fe1a94c0"`);
    await queryRunner.query(`DROP TABLE "group_permissions"`);
    await queryRunner.query(`DROP INDEX "IDX_4c5f2c23c34f3921fbad2cd394"`);
    await queryRunner.query(`DROP INDEX "IDX_95bf94c61795df25a515435010"`);
    await queryRunner.query(`DROP TABLE "user_groups"`);
    await queryRunner.query(`DROP TABLE "oauth_tokens_accesstokens"`);
    await queryRunner.query(`DROP TABLE "tenant"`);
    await queryRunner.query(`DROP TABLE "database"`);
    await queryRunner.query(`DROP TABLE "content_types"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "todo"`);
  }
}
