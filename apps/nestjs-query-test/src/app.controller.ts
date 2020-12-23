import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
  ) {
    this.logger.setContext(AppController.name);
  }

  @Get()
  getHello(): string {
    this.logger.debug('what is this');
    this.logger.warn('what is this');
    this.logger.log({ level: 'info', message: 'what is this' });
    return this.appService.getHello();
  }
}
