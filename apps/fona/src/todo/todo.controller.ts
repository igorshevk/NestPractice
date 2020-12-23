import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Crud, CrudController } from '@nestjsx/crud';
import { TodoEntity } from './todo.entity';
import { TodoService } from './todo.service';

@ApiTags('todo')
@Crud({
  model: {
    type: TodoEntity,
  },
})
@Controller('/todo')
export class TodoController implements CrudController<TodoEntity> {
  constructor(public service: TodoService) {}
}
