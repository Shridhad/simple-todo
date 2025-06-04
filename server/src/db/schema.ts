
import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define the status enum
export const todoStatusEnum = pgEnum('todo_status', ['pending', 'completed']);

export const todosTable = pgTable('todos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  status: todoStatusEnum('status').notNull().default('pending'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Todo = typeof todosTable.$inferSelect; // For SELECT operations
export type NewTodo = typeof todosTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { todos: todosTable };
