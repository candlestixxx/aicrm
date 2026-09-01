import React from 'react';

export default function AgentAuditPanel({ logs }: { logs: any[] }) {
  return (
    <div className="p-4 border rounded-md shadow-sm bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Agent Chain of Thought</h3>
      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="p-3 bg-white border rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm text-blue-600">{log.action}</span>
              <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-700">{log.reasoning}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
