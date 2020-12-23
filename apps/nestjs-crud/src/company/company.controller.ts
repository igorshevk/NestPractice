import { Controller } from '@nestjs/common';
import { Crud, CrudController } from '@nestjsx/crud';

import { Company } from './company.entity';
import { CompanyService } from './company.service';

@Crud({
  model: {
    type: Company,
  },
})
@Controller('company')
export class CompanyController implements CrudController<Company> {
  constructor(public service: CompanyService) {}
}
