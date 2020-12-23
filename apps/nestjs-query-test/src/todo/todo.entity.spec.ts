import { TodoEntity } from './todo.entity';

describe('TodoItemEntity', () => {
  it('should be defined', () => {
    expect(new TodoEntity()).toBeDefined();
  });
});
