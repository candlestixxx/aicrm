import React from 'react';

export default function ApprovalQueue({ items, onApprove, onReject }: { items: any[], onApprove: (id: string) => void, onReject: (id: string) => void }) {
  if (items.length === 0) {
    return <div className="text-gray-500 italic p-4">No pending actions requiring approval.</div>;
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
          <div className="flex justify-between">
            <h4 className="font-semibold text-yellow-800">Review Required: {item.actionType}</h4>
            <div className="space-x-2">
              <button 
                onClick={() => onReject(item.id)}
                className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
              >
                Reject
              </button>
              <button 
                onClick={() => onApprove(item.id)}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Approve
              </button>
            </div>
          </div>
          <pre className="mt-2 text-xs p-2 bg-gray-100 rounded overflow-x-auto">
            {JSON.stringify(JSON.parse(item.payload), null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
}
