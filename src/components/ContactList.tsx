'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Search, Plus, Download, Upload, ChevronLeft, ChevronRight,
  Phone, Mail, MapPin, Pencil, Trash2, X,
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  source: string | null;
  tags: string;
  isLead: boolean;
  createdAt: string;
  lead?: {
    id: string;
    status: string;
    stage?: { name: string; color: string };
  } | null;
  assignedAgent?: {
    id: string;
    user: { name: string; email: string };
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ContactsResponse {
  contacts: Contact[];
  pagination: Pagination;
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  hot: 'bg-red-100 text-red-700',
  cold: 'bg-slate-100 text-slate-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-amber-100 text-amber-700',
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ContactList() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    imported: number; skipped: number; errors?: { row: number; message: string }[];
  } | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '', lastName: '', email: '', phone: '', isLead: false,
  });

  const params = new URLSearchParams({
    page: String(page),
    limit: '25',
    sort: 'createdAt',
    order: 'desc',
  });
  if (search) params.set('search', search);
  if (statusFilter) params.set('status', statusFilter);

  const { data, isLoading, mutate } = useSWR<ContactsResponse>(
    `/api/contacts?${params}`,
    fetcher
  );

  const contacts = data?.contacts ?? [];
  const pagination = data?.pagination ?? {
    page: 1, limit: 25, total: 0, totalPages: 0,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleImport = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
        mutate();
      }
    } catch (err) {
      console.error('Import failed', err);
    }
  };

  const handleExport = () => {
    window.open('/api/contacts/export', '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewContact({ firstName: '', lastName: '', email: '', phone: '', isLead: false });
        mutate();
      }
    } catch (err) {
      console.error('Failed to add contact', err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;

    try {
      const res = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editingContact.firstName,
          lastName: editingContact.lastName,
          email: editingContact.email,
          phone: editingContact.phone,
        }),
      });
      if (res.ok) {
        setEditingContact(null);
        mutate();
      }
    } catch (err) {
      console.error('Edit failed', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="hot">Hot</option>
            <option value="cold">Cold</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Import Contacts (CSV)</h3>
              <button onClick={() => { setShowImport(false); setImportResult(null); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {!importResult ? (
              <>
                <p className="text-sm text-gray-600">
                  Upload a CSV file with headers: First Name, Last Name, Email, Phone, etc.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                <button
                  onClick={handleImport}
                  disabled={!importFile}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Import Contacts
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  Imported {importResult.imported} contacts
                  {importResult.skipped > 0 && ` (${importResult.skipped} skipped)`}
                </div>
                {importResult.errors?.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">Row {err.row}: {err.message}</p>
                ))}
                <button
                  onClick={() => { setShowImport(false); setImportResult(null); }}
                  className="w-full bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Add Contact</h3>
              <button onClick={() => setShowAdd(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={newContact.isLead}
                  onChange={(e) => setNewContact({ ...newContact, isLead: e.target.checked })}
                />
                Create as lead (adds to pipeline)
              </label>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Add Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingContact && editingContact.id && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Edit Contact</h3>
              <button onClick={() => setEditingContact(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                type="text"
                placeholder="First Name"
                value={editingContact.firstName}
                onChange={(e) => setEditingContact({ ...editingContact, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={editingContact.lastName}
                onChange={(e) => setEditingContact({ ...editingContact, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={editingContact.email || ''}
                onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={editingContact.phone || ''}
                onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Source</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    Loading contacts...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No contacts found.{' '}
                    <button
                      onClick={() => setShowImport(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Import your first contacts?
                    </button>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                        {contact.isLead && contact.lead?.stage && (
                          <span
                            className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: contact.lead.stage.color + '20',
                              color: contact.lead.stage.color,
                            }}
                          >
                            {contact.lead.stage.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5 text-gray-600">
                        {contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {contact.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                      {contact.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {contact.city}{contact.state ? `, ${contact.state}` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {contact.isLead && contact.lead ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[contact.lead.status] || 'bg-gray-100 text-gray-700'}`}>
                          {contact.lead.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Contact</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-sm">
                      {contact.source || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingContact(contact)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
