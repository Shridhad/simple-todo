
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          status: 'pending'
        },
        {
          title: 'Second Todo',
          description: null,
          status: 'completed'
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].title).toBeDefined();
    expect(result[0].status).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return todos ordered by creation date (newest first)', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({
        title: 'Older Todo',
        description: 'Created first',
        status: 'pending'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({
        title: 'Newer Todo',
        description: 'Created second',
        status: 'pending'
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Newer Todo');
    expect(result[1].title).toEqual('Older Todo');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle todos with nullable description', async () => {
    await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        status: 'pending'
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].title).toEqual('Todo with null description');
  });
});
