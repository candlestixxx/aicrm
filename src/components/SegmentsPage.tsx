import React from 'react';

export default function SegmentsPage() {
  // Static mockup for now
  const segments = [
    { id: '1', name: 'Hot Detroit Buyers', count: 42, filters: { status: 'hot', city: 'Detroit' } },
    { id: '2', name: 'Uncontacted Leads', count: 12, filters: { status: 'new', lastContacted: null } },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Segments (Smart Lists)</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Create Segment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map(segment => (
          <div key={segment.id} className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-shadow">
            <h3 className="text-lg font-semibold mb-2">{segment.name}</h3>
            <p className="text-gray-500 mb-4">{segment.count} Contacts</p>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 font-mono">
              {JSON.stringify(segment.filters)}
            </div>
            <button className="mt-4 w-full py-2 border rounded text-gray-700 hover:bg-gray-50">
              View Contacts
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
