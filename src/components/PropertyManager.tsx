'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Home, MapPin, DollarSign, BedDouble, Bath, Trash2 } from 'lucide-react';

interface Property {
  id: string;
  mlsNumber: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  listPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  status: string;
  listingAgent?: { id: string; user: { name: string | null; email: string } } | null;
}

interface PropertyResponse {
  properties: Property[];
  pagination: { total: number; page: number; totalPages: number };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  sold: 'bg-blue-100 text-blue-700',
  off_market: 'bg-gray-100 text-gray-600',
};

export default function PropertyManager() {
  const { data, isLoading, mutate } = useSWR<PropertyResponse>(
    '/api/properties?limit=50',
    fetcher
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    propertyType: 'single_family',
    listPrice: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    status: 'active',
  });

  const properties = data?.properties ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          listPrice: form.listPrice ? parseFloat(form.listPrice) : null,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
          squareFeet: form.squareFeet ? parseInt(form.squareFeet) : null,
        }),
      });
      setShowForm(false);
      setForm({
        address: '', city: '', state: '', zip: '', propertyType: 'single_family',
        listPrice: '', bedrooms: '', bathrooms: '', squareFeet: '', status: 'active',
      });
      mutate();
    } catch (err) {
      console.error('Failed to create property', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this property?')) return;
    try {
      await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error('Failed to delete property', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Properties ({data?.pagination.total ?? 0})
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-gray-200 rounded-xl p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Street Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                placeholder="State"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                placeholder="ZIP"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="single_family">Single Family</option>
                <option value="condo">Condo</option>
                <option value="multi_family">Multi-Family</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
              <input
                type="number"
                placeholder="List Price"
                value={form.listPrice}
                onChange={(e) => setForm({ ...form, listPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Bedrooms"
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                step="0.5"
                placeholder="Bathrooms"
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Square Feet"
                value={form.squareFeet}
                onChange={(e) => setForm({ ...form, squareFeet: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="off_market">Off Market</option>
              </select>
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
                Add Property
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-8">Loading properties...</div>
      ) : properties.length === 0 ? (
        <div className="bg-surface rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          No properties yet. Add your first listing.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div
              key={p.id}
              className="bg-surface border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-500" />
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[p.status] || STATUS_COLORS.off_market}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="mt-3 font-semibold text-gray-900">{p.address}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {p.city}, {p.state} {p.zip}
              </p>

              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                {p.listPrice && (
                  <span className="flex items-center gap-1 font-medium text-green-700">
                    <DollarSign className="w-3 h-3" />${p.listPrice.toLocaleString()}
                  </span>
                )}
                {p.bedrooms !== null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-3 h-3" />{p.bedrooms}
                  </span>
                )}
                {p.bathrooms !== null && (
                  <span className="flex items-center gap-1">
                    <Bath className="w-3 h-3" />{p.bathrooms}
                  </span>
                )}
                {p.squareFeet && (
                  <span>{p.squareFeet.toLocaleString()} sqft</span>
                )}
              </div>

              {p.mlsNumber && (
                <p className="mt-2 text-xs text-gray-400">MLS #{p.mlsNumber}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
