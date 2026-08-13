'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Users, UserPlus, Mail, Phone, Trash2, X } from 'lucide-react';

interface Agent {
  id: string;
  title: string | null;
  phone: string | null;
  commissionSplit: number | null;
  licenseNumber: string | null;
  teamId: string | null;
  user: { id: string; name: string | null; email: string; role: string };
  team: { id: string; name: string } | null;
  _count: { contacts: number; tasks: number; listedProperties: number };
}

interface Team {
  id: string;
  name: string;
  agents: { id: string; user: { name: string | null; email: string } }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TeamManager() {
  const { data, isLoading, mutate } = useSWR<{ agents: Agent[]; teams: Team[] }>(
    '/api/team',
    fetcher
  );
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState('');
  const [inviting, setInviting] = useState(false);

  const agents = data?.agents ?? [];
  const teams = data?.teams ?? [];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult('');
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteResult(data.message);
        setInviteEmail('');
        setShowInvite(false);
      } else {
        setInviteResult(data.error || 'Failed to invite');
      }
    } catch {
      setInviteResult('Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this agent from the brokerage?')) return;
    try {
      await fetch(`/api/team/${id}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error('Failed to remove agent', err);
    }
  };

  const handleCommissionChange = async (agent: Agent, value: number) => {
    try {
      await fetch(`/api/team/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionSplit: value }),
      });
      mutate();
    } catch (err) {
      console.error('Failed to update commission', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" /> Team ({agents.length})
        </h2>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" /> Invite Agent
        </button>
      </div>

      {showInvite && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Invite a team member</h3>
              <button onClick={() => setShowInvite(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <input
              type="email"
              placeholder="agent@brokerage.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            {inviteResult && (
              <p className="text-sm text-green-600">{inviteResult}</p>
            )}
            <button
              type="submit"
              disabled={inviting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {inviting ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>
        </div>
      )}

      {/* Teams */}
      {teams.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500">Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div key={team.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-semibold text-gray-900">{team.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {team.agents.length} member{team.agents.length !== 1 ? 's' : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {team.agents.map((a) => (
                    <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {a.user.name || a.user.email}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents table */}
      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading team...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Agent</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Team</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Commission</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Stats</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{agent.user.name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500">{agent.user.role}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-gray-600 text-xs space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {agent.user.email}
                      </div>
                      {agent.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {agent.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-600 text-sm">
                    {agent.team?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={agent.commissionSplit ?? 70}
                      onBlur={(e) =>
                        handleCommissionChange(agent, parseFloat(e.target.value))
                      }
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />%
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                    {agent._count.contacts} contacts · {agent._count.tasks} tasks ·{' '}
                    {agent._count.listedProperties} listings
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(agent.id)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
