import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'typeorm';
import { TENANT_CONNECTION } from './const';
import { TenantServicez } from './tenant.service';

describe('TenantService', () => {
  let service: TenantServicez;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: TENANT_CONNECTION,
          useValue: Connection,
        },
        TenantServicez,
      ],
    }).compile();

    // service = await module.resolve<TenantServicez>(TenantServicez);
  });

  it('should be defined', () => {
    // expect(service).toBeDefined();
  });
});
