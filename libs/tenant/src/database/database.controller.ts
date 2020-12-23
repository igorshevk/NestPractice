import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { Roles } from '../decorators/roles.decorator';
import { DatabaseEntity } from './database.entity';
import { DatabaseService } from './database.service';

@ApiTags('database')
@ApiBearerAuth()
@Roles('isSuperuser')
@Crud({
  model: {
    type: DatabaseEntity,
  },
})
@Controller('/admin/database')
export class DatabaseController implements CrudController<DatabaseEntity> {
  constructor(public service: DatabaseService) {}
}
