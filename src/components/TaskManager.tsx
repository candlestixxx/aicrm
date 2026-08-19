'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Check, Trash2, Clock, Phone, Mail, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  type: string;
  contact: { id: string; firstName: string; lastName: string } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  meeting: <Calendar className="w-3 h-3" />,
  showing: <Calendar className="w-3 h-3" />,
  follow_up: <Clock className="w-3 h-3" />,
  other: <Clock className="w-3 h-3" />,
};

export default function TaskManager() {
  const { data, isLoading, mutate } = useSWR<{ tasks: Task[] }>(
    '/api/tasks',
    fetcher
  );
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [type, setType] = useState('follow_up');

  const tasks = data?.tasks ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, dueDate: dueDate || null, priority, type }),
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowForm(false);
      mutate();
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: task.status === 'completed' ? 'pending' : 'completed' }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Tasks ({pendingTasks.length} pending)
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-gray-200 rounded-xl p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Task title (e.g., 'Call John about the offer')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="showing">Showing</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading tasks...</div>
      ) : (
        <div className="space-y-2">
          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="bg-surface rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No tasks yet. Create your first task to stay on top of follow-ups.
            </div>
          ) : (
            <>
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-surface border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleComplete(task)}
                      className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 flex items-center justify-center"
                      title="Mark complete"
                    >
                      <Check className="w-3 h-3 text-transparent" />
                    </button>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          {TYPE_ICONS[task.type] || TYPE_ICONS.other}
                          {task.type.replace('_', ' ')}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleString()}
                          </span>
                        )}
                        {task.contact && (
                          <span className="text-xs text-blue-600">
                            {task.contact.firstName} {task.contact.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {completedTasks.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 py-2">
                    Completed ({completedTasks.length})
                  </summary>
                  <div className="space-y-2 mt-1">
                    {completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center justify-between gap-3 opacity-60"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleComplete(task)}
                            className="mt-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                            title="Mark pending"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </button>
                          <p className="text-sm text-gray-500 line-through">{task.title}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
