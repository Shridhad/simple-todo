
import { z } from 'zod';

// Todo status enum
export const todoStatusSchema = z.enum(['pending', 'completed']);
export type TodoStatus = z.infer<typeof todoStatusSchema>;

// Todo schema
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: todoStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todos
export const createTodoInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  status: todoStatusSchema.optional()
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todos
export const updateTodoInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  status: todoStatusSchema.optional()
});

export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

// Input schema for deleting todos
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;
