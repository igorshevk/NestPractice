import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedRequest,
} from '@nestjsx/crud';
import { Roles } from './decorators/roles.decorator';
import { TenantEntity } from './tenant.entity';
import { TenantServicez } from './tenant.service';

@ApiTags('tenant')
@ApiBearerAuth()
@Roles('isSuperuser')
@Crud({
  model: {
    type: TenantEntity,
  },
})
@Controller('/admin/tenant')
export class TenantController implements CrudController<TenantEntity> {
  constructor(public service: TenantServicez) {}
}
