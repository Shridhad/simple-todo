
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput = { title: 'Test Todo' }) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null,
      status: input.status || 'pending'
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual(testTodo.description);
    expect(result.status).toEqual(testTodo.status);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update todo status', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      status: 'completed'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual(testTodo.title);
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    const testTodo = await createTestTodo({ title: 'Test Todo', description: 'Original description' });
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.description).toEqual('Updated description');
    expect(result.title).toEqual(testTodo.title);
    expect(result.status).toEqual(testTodo.status);
  });

  it('should set description to null', async () => {
    const testTodo = await createTestTodo({ title: 'Test Todo', description: 'Some description' });
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.description).toBeNull();
    expect(result.title).toEqual(testTodo.title);
    expect(result.status).toEqual(testTodo.status);
  });

  it('should update multiple fields at once', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'New Title',
      description: 'New description',
      status: 'completed'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should save changes to database', async () => {
    const testTodo = await createTestTodo();
    
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Database Updated Title',
      status: 'completed'
    };

    await updateTodo(updateInput);

    // Verify changes were persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Updated Title');
    expect(todos[0].status).toEqual('completed');
    expect(todos[0].updated_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at > testTodo.updated_at).toBe(true);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999999,
      title: 'This will fail'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve unchanged fields', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original Description',
      status: 'pending'
    });
    
    // Only update the title
    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Only Title Changed'
    };

    const result = await updateTodo(updateInput);

    // Title should be updated
    expect(result.title).toEqual('Only Title Changed');
    
    // Other fields should remain unchanged
    expect(result.description).toEqual('Original Description');
    expect(result.status).toEqual('pending');
    expect(result.created_at).toEqual(testTodo.created_at);
    
    // Only updated_at should change
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });
});
