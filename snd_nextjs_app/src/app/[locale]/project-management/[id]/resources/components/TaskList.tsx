'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import ApiService from '@/lib/api-service';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  completion_percentage: number;
  assigned_to: { id: string; name: string } | null;
  created_at: string;
  updated_at: string;
}

interface TaskListProps {
  tasks: ProjectTask[];
  onEdit: (task: ProjectTask) => void;
  onDelete: (task: ProjectTask) => void;
  onStatusChange: (task: ProjectTask, status: string) => void;
  onCompletionChange: (task: ProjectTask, percentage: number) => void;
  dependencies?: { [taskId: string]: ProjectTask[] };
  onAddDependency?: (taskId: string, dependsOnId: string) => void;
  onRemoveDependency?: (taskId: string, dependsOnId: string) => void;
}

export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onCompletionChange,
  dependencies = {},
  onAddDependency,
  onRemoveDependency,
}: TaskListProps) {
  const [selectedDependency, setSelectedDependency] = useState<{ [taskId: string]: string }>({});

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-slate-100">
            Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-800">
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-slate-100">
            Low
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="border-yellow-200 bg-yellow-100 text-yellow-800">
            Medium
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">
            High
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isDueOrOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due <= today;
  };

  const handleStatusChange = async (task: ProjectTask, status: string) => {
    try {
      await onStatusChange(task, status);
      toast.success('Task status updated successfully');
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const handleCompletionChange = async (task: ProjectTask, percentage: number) => {
    try {
      await onCompletionChange(task, percentage);
      toast.success('Task completion updated successfully');
    } catch (error) {
      toast.error('Failed to update task completion');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-lg font-medium text-gray-900">No tasks found</p>
        <p className="mt-1 text-sm text-gray-500">Add tasks to track project progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="rounded-md border p-4 transition-shadow hover:shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium">{task.title}</h3>
                {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {task.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-500" />}
                {task.due_date && isDueOrOverdue(task.due_date) && task.status !== 'completed' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>

              <p className="line-clamp-2 text-sm text-gray-500">
                {task.description || 'No description'}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {getStatusBadge(task.status)}
                {getPriorityBadge(task.priority)}
                {task.due_date && (
                  <Badge
                    variant="outline"
                    className={
                      isDueOrOverdue(task.due_date) && task.status !== 'completed'
                        ? 'border-red-200 bg-red-100 text-red-800'
                        : ''
                    }
                  >
                    Due {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                  </Badge>
                )}
                {task.assigned_to && (
                  <Badge
                    variant="outline"
                    className="border-purple-200 bg-purple-100 text-purple-800"
                  >
                    {task.assigned_to.name}
                  </Badge>
                )}
              </div>

              <div className="mt-2">
                <span className="text-xs text-gray-500">Depends on: </span>
                {dependencies[task.id] && dependencies[task.id].length > 0 ? (
                  dependencies[task.id].map(dep => (
                    <span
                      key={dep.id}
                      className="mr-1 inline-block rounded bg-slate-200 px-2 py-0.5 text-xs"
                    >
                      {dep.title}
                      {onRemoveDependency && (
                        <button
                          type="button"
                          className="ml-1 text-red-500"
                          onClick={() => onRemoveDependency(task.id, dep.id)}
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">None</span>
                )}
                {onAddDependency && (
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      className="rounded border px-2 py-1 text-xs"
                      value={selectedDependency[task.id] || ''}
                      onChange={e =>
                        setSelectedDependency({ ...selectedDependency, [task.id]: e.target.value })
                      }
                    >
                      <option value="">Add dependency...</option>
                      {tasks
                        .filter(
                          t =>
                            t.id !== task.id &&
                            !(dependencies[task.id] || []).some(dep => dep.id === t.id)
                        )
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="rounded bg-blue-500 px-2 py-1 text-xs text-white"
                      disabled={!selectedDependency[task.id]}
                      onClick={() => {
                        if (selectedDependency[task.id]) {
                          onAddDependency(task.id, selectedDependency[task.id]);
                          setSelectedDependency({ ...selectedDependency, [task.id]: '' });
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Task</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(task)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Task</span>
                  </DropdownMenuItem>
                  {task.status !== 'completed' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'completed')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      <span>Mark as Completed</span>
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'in_progress' && task.status !== 'completed' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'in_progress')}>
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Mark as In Progress</span>
                    </DropdownMenuItem>
                  )}
                  {task.status !== 'pending' && (
                    <DropdownMenuItem onClick={() => handleStatusChange(task, 'pending')}>
                      <span>Mark as Pending</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium">{task.completion_percentage}% completed</span>
              <div className="flex space-x-2">
                {task.status !== 'completed' && task.completion_percentage < 100 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 py-0 text-xs"
                      onClick={() =>
                        handleCompletionChange(task, Math.min(100, task.completion_percentage + 10))
                      }
                    >
                      +10%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 py-0 text-xs"
                      onClick={() => handleCompletionChange(task, 100)}
                    >
                      Mark 100%
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Progress value={task.completion_percentage} className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
