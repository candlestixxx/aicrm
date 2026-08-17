'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Zap, Plus, Trash2, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';

interface TriggerEvent {
  value: string;
  label: string;
  description: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  triggerEvent: string;
  triggerCondition: { field: string; operator: string; value?: string } | null;
  actions: {
    type: string;
    status?: string;
    title?: string;
    note?: string;
    channel?: string;
    body?: string;
    email?: string;
    subject?: string;
    prompt?: string;
    purpose?: string;
    recipientName?: string;
    propertyInfo?: string;
  }[];
  status: string;
  runCount: number;
  lastRunAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ACTION_TYPE_LABELS: Record<string, string> = {
  update_lead_stage: 'Update lead stage',
  create_task: 'Create task',
  add_activity: 'Log activity',
  notify: 'Send notification',
  create_communication: 'Send communication',
  ai_draft: '🤖 AI — draft email/SMS',
  ai_analyze: '🤖 AI — analyze',
  negotiation_advisor: '🤖 AI — negotiation advisor',
};

export default function WorkflowBuilder() {
  const { data, isLoading, mutate } = useSWR<{
    workflows: Workflow[];
    triggerEvents: TriggerEvent[];
  }>('/api/hypernexus/workflows', fetcher);

  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    triggerEvent: 'communication_received',
    conditionField: 'body',
    conditionOperator: 'contains',
    conditionValue: 'yes',
    actionType: 'update_lead_stage',
    actionStatus: 'hot',
    actionTitle: '',
    actionNote: '',
    actionEmail: '',
    actionBody: '',
    actionPrompt: '',
    actionPurpose: '',
  });

  const workflows = data?.workflows ?? [];
  const triggerEvents = data?.triggerEvents ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const triggerCondition = form.conditionValue
      ? {
          field: form.conditionField,
          operator: form.conditionOperator,
          value: form.conditionValue,
        }
      : null;

    let actions: Workflow['actions'] = [];
    switch (form.actionType) {
      case 'update_lead_stage':
        actions = [{ type: 'update_lead_stage', status: form.actionStatus }];
        break;
      case 'create_task':
        actions = [{ type: 'create_task', title: form.actionTitle || 'Follow-up task' }];
        break;
      case 'add_activity':
        actions = [{ type: 'add_activity', note: form.actionNote || 'Workflow triggered' }];
        break;
      case 'notify':
        actions = [
          {
            type: 'notify',
            email: form.actionEmail,
            subject: `HyperNexus: ${form.name}`,
            body: form.actionBody || 'A workflow was triggered.',
          },
        ];
        break;
      case 'create_communication':
        actions = [
          { type: 'create_communication', channel: 'email', body: form.actionBody || 'Message' },
        ];
        break;
      case 'ai_draft':
        actions = [
          { type: 'ai_draft', channel: 'email', purpose: form.actionPurpose || form.actionBody || 'follow up', prompt: form.actionPrompt || undefined },
        ];
        break;
      case 'ai_analyze':
        actions = [
          { type: 'ai_analyze', prompt: form.actionPrompt || form.actionBody || undefined },
        ];
        break;
      case 'negotiation_advisor':
        actions = [
          { type: 'negotiation_advisor', purpose: form.actionPurpose || form.actionBody || 'this offer', prompt: form.actionPrompt || undefined },
        ];
        break;
    }

    try {
      await fetch('/api/hypernexus/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          triggerEvent: form.triggerEvent,
          triggerCondition,
          actions,
        }),
      });
      setShowForm(false);
      setForm({
        name: '', description: '', triggerEvent: 'communication_received',
        conditionField: 'body', conditionOperator: 'contains', conditionValue: 'yes',
        actionType: 'update_lead_stage', actionStatus: 'hot', actionTitle: '',
        actionNote: '', actionEmail: '', actionBody: '', actionPrompt: '', actionPurpose: '',
      });
      mutate();
    } catch (err) {
      console.error('Failed to create workflow', err);
    }
  };

  const handleToggle = async (workflow: Workflow) => {
    try {
      await fetch(`/api/hypernexus/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: workflow.status === 'active' ? 'paused' : 'active',
        }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to toggle workflow', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await fetch(`/api/hypernexus/workflows/${id}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error('Failed to delete workflow', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">Automation Workflows</h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
        >
          <Plus className="w-4 h-4" /> New Workflow
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-purple-200 rounded-xl p-5 space-y-4">
          <h4 className="font-medium text-gray-900">Create Workflow</h4>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Workflow name (e.g., 'Hot lead on reply')"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <select
                value={form.triggerEvent}
                onChange={(e) => setForm({ ...form, triggerEvent: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {triggerEvents.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Condition */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">WHEN (condition)</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Field (e.g., body)"
                  value={form.conditionField}
                  onChange={(e) => setForm({ ...form, conditionField: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[100px]"
                />
                <select
                  value={form.conditionOperator}
                  onChange={(e) => setForm({ ...form, conditionOperator: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="contains">contains</option>
                  <option value="equals">equals</option>
                  <option value="not_contains">does not contain</option>
                  <option value="exists">exists</option>
                </select>
                <input
                  type="text"
                  placeholder="Value (e.g., yes)"
                  value={form.conditionValue}
                  onChange={(e) => setForm({ ...form, conditionValue: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 min-w-[100px]"
                />
              </div>
              <p className="text-xs text-gray-400">
                Leave value blank to fire on every event.
              </p>
            </div>

            {/* Action */}
            <div className="bg-purple-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-purple-600">THEN (action)</p>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={form.actionType}
                  onChange={(e) => setForm({ ...form, actionType: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="update_lead_stage">Update lead stage</option>
                  <option value="create_task">Create task</option>
                  <option value="add_activity">Log activity</option>
                  <option value="create_communication">Send communication</option>
                  <option value="notify">Notify (email)</option>
                  <option value="ai_draft">🤖 AI — draft email/SMS</option>
                  <option value="ai_analyze">🤖 AI — analyze</option>
                  <option value="negotiation_advisor">🤖 AI — negotiation advisor</option>
                </select>

                {form.actionType === 'update_lead_stage' && (
                  <select
                    value={form.actionStatus}
                    onChange={(e) => setForm({ ...form, actionStatus: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="hot">Hot</option>
                    <option value="active">Active</option>
                    <option value="new">New</option>
                    <option value="cold">Cold</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                )}

                {form.actionType === 'create_task' && (
                  <input
                    type="text"
                    placeholder="Task title"
                    value={form.actionTitle}
                    onChange={(e) => setForm({ ...form, actionTitle: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                  />
                )}

                {form.actionType === 'add_activity' && (
                  <input
                    type="text"
                    placeholder="Activity note"
                    value={form.actionNote}
                    onChange={(e) => setForm({ ...form, actionNote: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                  />
                )}

                {(form.actionType === 'notify' || form.actionType === 'create_communication') && (
                  <>
                    {form.actionType === 'notify' && (
                      <input
                        type="email"
                        placeholder="Notify email"
                        value={form.actionEmail}
                        onChange={(e) => setForm({ ...form, actionEmail: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Message body"
                      value={form.actionBody}
                      onChange={(e) => setForm({ ...form, actionBody: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                    />
                  </>
                )}

                {(form.actionType === 'ai_draft' ||
                  form.actionType === 'ai_analyze' ||
                  form.actionType === 'negotiation_advisor') && (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      placeholder={
                        form.actionType === 'negotiation_advisor'
                          ? 'Advise on (e.g., counter at $450k or $460k?)'
                          : 'Purpose (e.g., follow up after showing)'
                      }
                      value={form.actionPurpose}
                      onChange={(e) => setForm({ ...form, actionPurpose: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Custom prompt (optional — overrides the default)"
                      value={form.actionPrompt}
                      onChange={(e) => setForm({ ...form, actionPrompt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                )}
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                Create Workflow
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-6">Loading workflows...</div>
      ) : workflows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
          No workflows yet. Create one to automate your CRM — e.g., &quot;when a lead
          replies &apos;yes&apos;, mark them Hot.&quot;
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      workflow.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{workflow.name}</p>
                    <p className="text-xs text-gray-500">
                      {workflow.triggerEvent} · ran {workflow.runCount}×
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpanded(expanded === workflow.id ? null : workflow.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {expanded === workflow.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggle(workflow)}
                    className={`p-1 ${
                      workflow.status === 'active'
                        ? 'text-green-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={workflow.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    {workflow.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="p-1 text-gray-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expanded === workflow.id && (
                <div className="px-4 pb-4 space-y-2 text-xs">
                  <div className="bg-gray-50 rounded p-2">
                    <span className="text-gray-400">CONDITION: </span>
                    {workflow.triggerCondition
                      ? `${workflow.triggerCondition.field} ${workflow.triggerCondition.operator} "${workflow.triggerCondition.value}"`
                      : 'always'}
                  </div>
                  <div className="bg-purple-50 rounded p-2">
                    <span className="text-purple-400">ACTIONS: </span>
                    {workflow.actions.map((a, i) => (
                      <span key={i} className="block mt-1">
                        {ACTION_TYPE_LABELS[a.type] || a.type}
                        {a.status && ` → ${a.status}`}
                        {a.title && ` → ${a.title}`}
                        {a.note && ` → ${a.note}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
