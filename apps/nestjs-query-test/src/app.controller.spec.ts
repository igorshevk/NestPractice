import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import masterDatabase from './config/master-database';
import loggerOptions from './config/logger';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: join('./apps/fona/.env'),
          load: [masterDatabase, loggerOptions],
        }),
        WinstonModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => {
            return config.get('winston');
          },
          inject: [ConfigService],
        }),
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      // expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
