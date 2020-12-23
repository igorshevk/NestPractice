import {
  Connection,
  createConnection,
  getConnectionOptions,
  QueryRunner,
} from 'typeorm';
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: Connection;

  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
      // ... any one time initialization goes here ...
    }
    return DatabaseConnection.instance;
  }

  public async queryRunner(): Promise<QueryRunner> {
    if (!this.connection) {
      await this.createConnection();
    }
    return this.connection.createQueryRunner();
  }

  async createConnection(name = 'test') {
    if (!this.connection) {
      let connectionOptions = await getConnectionOptions(name);
      connectionOptions = {
        ...connectionOptions,
        name: 'default',
      };
      this.connection = await createConnection(connectionOptions);
    }
  }

  public async truncateOne(tablesName: string) {
    await this.createConnection();
    await this.connection.query('SET foreign_key_checks = 0;');
    await this.connection.getRepository(tablesName).clear();
    await this.connection.query('SET foreign_key_checks = 1;');
  }

  public async truncate(tablesName: string[]) {
    await this.createConnection();
    await this.connection.query('SET foreign_key_checks = 0;');
    const execute = tablesName.map(async table => {
      return this.connection.getRepository(table).clear();
    });
    await Promise.all(execute);
    await this.connection.query('SET foreign_key_checks = 1;');
  }

  public async batchInsertData(tableName: string, dataSets: any): Promise<any> {
    await this.createConnection();
    const repo = this.connection.getRepository(tableName);
    return repo.save(repo.create(dataSets));
  }

  public async closeConnection() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}

const databaseInstance = DatabaseConnection.getInstance();
export { databaseInstance };
