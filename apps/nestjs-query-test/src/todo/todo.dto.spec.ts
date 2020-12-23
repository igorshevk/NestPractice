import { TodoItemDTO } from './todo.dto';

describe('TodoItemDto', () => {
  it('should be defined', () => {
    expect(new TodoItemDTO()).toBeDefined();
  });
});
