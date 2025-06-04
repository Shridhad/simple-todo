
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing',
  status: 'pending'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with all fields', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with minimal fields', async () => {
    const minimalInput: CreateTodoInput = {
      title: 'Minimal Todo'
    };

    const result = await createTodo(minimalInput);

    expect(result.title).toEqual('Minimal Todo');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('pending'); // Default status
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with completed status', async () => {
    const completedInput: CreateTodoInput = {
      title: 'Completed Todo',
      status: 'completed'
    };

    const result = await createTodo(completedInput);

    expect(result.title).toEqual('Completed Todo');
    expect(result.status).toEqual('completed');
    expect(result.description).toBeNull();
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].description).toEqual('A todo for testing');
    expect(todos[0].status).toEqual('pending');
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const nullDescInput: CreateTodoInput = {
      title: 'Todo with null description',
      description: null
    };

    const result = await createTodo(nullDescInput);

    expect(result.title).toEqual('Todo with null description');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('pending');

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].description).toBeNull();
  });
});
