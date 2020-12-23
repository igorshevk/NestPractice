import { MASTER_TNID } from '@lib/tenant/const';
import { ConnectionOptions } from 'typeorm';
export default () => ({
  database: {
    name: 'default',
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    // entities: [TenantEntity, DatabaseEntity],
    autoLoadEntities: true,
    synchronize: false,
    logging: true,
  } as ConnectionOptions,
});
