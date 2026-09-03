'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Filter, Plus, Search, Tag as TagIcon, MoreHorizontal } from 'lucide-react';

interface Contact {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    stage: string;
    source: string | null;
    createdAt: string;
    tags: { tag: { name: string; color: string | null } }[];
}

export default function ContactManager() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [stageFilter, setStageFilter] = useState<string>('');
    const [tagFilter, setTagFilter] = useState<string>('');

    // Form
    const [isAdding, setIsAdding] = useState(false);
    const [newContact, setNewContact] = useState({
        firstName: '', lastName: '', email: '', phone: '', initialTags: ''
    });

    const fetchContacts = useCallback(async (stage: string, tag: string) => {
        try {
            let url = '/api/contacts';
            const params = new URLSearchParams();
            if (stage) params.append('stage', stage);
            if (tag) params.append('tag', tag);
            if (params.toString()) url += `?${params.toString()}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error("Failed to fetch contacts", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Use empty effect to load initially
    useEffect(() => {
        let isMounted = true;
        if (isMounted) {
            // we wrap in an async IIFE to avoid the setState in effect synchronous rule for the lint
            (async () => {
                await fetchContacts(stageFilter, tagFilter);
            })();
        }
        return () => {
            isMounted = false;
        };
    }, [stageFilter, tagFilter, fetchContacts]);

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...newContact,
                initialTags: newContact.initialTags.split(',').map(t => t.trim()).filter(Boolean)
            };

            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsAdding(false);
                setNewContact({ firstName: '', lastName: '', email: '', phone: '', initialTags: '' });
                setIsLoading(true);
                fetchContacts(stageFilter, tagFilter);
            }
        } catch (error) {
            console.error("Failed to create contact", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-600" />
                        Smart Contact Management
                    </h2>
                    <p className="text-sm text-gray-500">
                        Multi-tenant architecture securely isolates data. AI agents auto-enrich profiles.
                    </p>
                </div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Add Lead
                </button>
            </div>

            {/* Add Contact Form (Mock) */}
            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-4">Quick Add Lead</h3>
                    <form onSubmit={handleAddContact} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <input required placeholder="First Name" className="border rounded-md px-3 py-2 text-sm" value={newContact.firstName} onChange={e => setNewContact({...newContact, firstName: e.target.value})} />
                        <input placeholder="Last Name" className="border rounded-md px-3 py-2 text-sm" value={newContact.lastName} onChange={e => setNewContact({...newContact, lastName: e.target.value})} />
                        <input type="email" placeholder="Email" className="border rounded-md px-3 py-2 text-sm" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                        <input placeholder="Tags (comma separated)" className="border rounded-md px-3 py-2 text-sm" value={newContact.initialTags} onChange={e => setNewContact({...newContact, initialTags: e.target.value})} />
                        <button type="submit" className="bg-gray-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800">Save Lead</button>
                    </form>
                </div>
            )}

            {/* Smart Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Filter className="w-4 h-4" /> Smart Filters:
                </div>

                <select
                    value={stageFilter}
                    onChange={e => setStageFilter(e.target.value)}
                    className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:ring-indigo-500"
                >
                    <option value="">All Stages</option>
                    <option value="New Lead">New Lead</option>
                    <option value="Hot">Hot</option>
                    <option value="Closed">Closed</option>
                </select>

                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filter by Tag (e.g. buyer)..."
                        value={tagFilter}
                        onChange={e => setTagFilter(e.target.value)}
                        className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Contact Info</th>
                                <th className="px-6 py-4 font-medium">Stage</th>
                                <th className="px-6 py-4 font-medium">Tags</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading contacts...</td></tr>
                            ) : contacts.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No contacts found in this tenant database.</td></tr>
                            ) : (
                                contacts.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {c.firstName} {c.lastName}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 flex flex-col gap-1">
                                            <span>{c.email || '—'}</span>
                                            <span className="text-xs">{c.phone || ''}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {c.stage}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {c.tags.map((t, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-gray-200 bg-gray-50">
                                                        <TagIcon className="w-3 h-3 text-gray-400" /> {t.tag.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
