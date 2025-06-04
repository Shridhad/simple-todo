
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoStatus } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating new todos
  const [createForm, setCreateForm] = useState<CreateTodoInput>({
    title: '',
    description: null,
    status: 'pending'
  });

  // Form state for editing todos
  const [editForm, setEditForm] = useState<UpdateTodoInput>({
    id: 0,
    title: '',
    description: null,
    status: 'pending'
  });

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | TodoStatus>('all');

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTodo.mutate(createForm);
      setTodos((prev: Todo[]) => [...prev, response]);
      setCreateForm({
        title: '',
        description: null,
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (todo: Todo) => {
    setEditingTodo(todo);
    setEditForm({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      status: todo.status
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.updateTodo.mutate(editForm);
      setTodos((prev: Todo[]) => 
        prev.map((todo: Todo) => todo.id === response.id ? response : todo)
      );
      setIsEditDialogOpen(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Failed to update todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleStatusToggle = async (todo: Todo) => {
    const newStatus: TodoStatus = todo.status === 'pending' ? 'completed' : 'pending';
    try {
      const response = await trpc.updateTodo.mutate({
        id: todo.id,
        status: newStatus
      });
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === response.id ? response : t)
      );
    } catch (error) {
      console.error('Failed to toggle todo status:', error);
    }
  };

  const filteredTodos = todos.filter((todo: Todo) => 
    statusFilter === 'all' || todo.status === statusFilter
  );

  const pendingCount = todos.filter((todo: Todo) => todo.status === 'pending').length;
  const completedCount = todos.filter((todo: Todo) => todo.status === 'completed').length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📝 Todo Manager</h1>
        <div className="flex gap-4 text-sm">
          <Badge variant="secondary" className="px-3 py-1">
            📋 {pendingCount} Pending
          </Badge>
          <Badge variant="default" className="px-3 py-1 bg-green-100 text-green-800">
            ✅ {completedCount} Completed
          </Badge>
        </div>
      </div>

      {/* Create Todo Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">✨ Create New Todo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="What needs to be done?"
                value={createForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreateForm((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
            </div>
            <div>
              <Textarea
                placeholder="Add description (optional)"
                value={createForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCreateForm((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-4">
              <Select
                value={createForm.status}
                onValueChange={(value: TodoStatus) =>
                  setCreateForm((prev: CreateTodoInput) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">📋 Pending</SelectItem>
                  <SelectItem value="completed">✅ Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isLoading} className="px-6">
                {isLoading ? '⏳ Creating...' : '➕ Add Todo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filter Controls */}
      <div className="flex gap-4 mb-6">
        <Select
          value={statusFilter}
          onValueChange={(value: 'all' | TodoStatus) => setStatusFilter(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🔍 All Todos</SelectItem>
            <SelectItem value="pending">📋 Pending Only</SelectItem>
            <SelectItem value="completed">✅ Completed Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Todo List */}
      {filteredTodos.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-500 text-lg">
              {statusFilter === 'all' 
                ? "No todos yet. Create your first one above!" 
                : `No ${statusFilter} todos found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTodos.map((todo: Todo) => (
            <Card key={todo.id} className={`transition-all hover:shadow-md ${
              todo.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-white'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusToggle(todo)}
                        className="p-1 h-8 w-8"
                      >
                        {todo.status === 'completed' ? '✅' : '⬜'}
                      </Button>
                      <h3 className={`text-lg font-semibold ${
                        todo.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {todo.title}
                      </h3>
                      <Badge variant={todo.status === 'completed' ? 'default' : 'secondary'}>
                        {todo.status === 'completed' ? '✅ Done' : '📋 Pending'}
                      </Badge>
                    </div>
                    {todo.description && (
                      <p className={`text-gray-600 mb-3 ml-11 ${
                        todo.status === 'completed' ? 'line-through' : ''
                      }`}>
                        {todo.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-400 ml-11 flex gap-4">
                      <span>📅 Created: {todo.created_at.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      <span>🔄 Updated: {todo.updated_at.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(todo)}
                          className="px-3"
                        >
                          ✏️ Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>✏️ Edit Todo</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                          <div>
                            <Input
                              placeholder="Todo title"
                              value={editForm.title || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setEditForm((prev: UpdateTodoInput) => ({ ...prev, title: e.target.value }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <Textarea
                              placeholder="Description (optional)"
                              value={editForm.description || ''}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setEditForm((prev: UpdateTodoInput) => ({
                                  ...prev,
                                  description: e.target.value || null
                                }))
                              }
                              className="min-h-[80px]"
                            />
                          </div>
                          <div>
                            <Select
                              value={editForm.status}
                              onValueChange={(value: TodoStatus) =>
                                setEditForm((prev: UpdateTodoInput) => ({ ...prev, status: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">📋 Pending</SelectItem>
                                <SelectItem value="completed">✅ Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsEditDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="px-3">
                          🗑️ Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>🗑️ Delete Todo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(todo.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
