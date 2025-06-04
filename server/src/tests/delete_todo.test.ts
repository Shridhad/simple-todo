
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        status: 'pending'
      })
      .execute();

    // Delete the todo
    const result = await deleteTodo(testDeleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);
  });

  it('should remove todo from database', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        status: 'pending'
      })
      .execute();

    // Delete the todo
    await deleteTodo(testDeleteInput);

    // Verify todo no longer exists in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testDeleteInput.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false for non-existent todo', async () => {
    // Try to delete a todo that doesn't exist
    const result = await deleteTodo({ id: 999 });

    // Verify deletion was not successful
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting specific todo', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        {
          title: 'Todo 1',
          description: 'First todo',
          status: 'pending'
        },
        {
          title: 'Todo 2', 
          description: 'Second todo',
          status: 'completed'
        }
      ])
      .execute();

    // Delete only the first todo
    const result = await deleteTodo(testDeleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify other todos still exist
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
  });
});
