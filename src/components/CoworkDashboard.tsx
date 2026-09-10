"use client";
import React from 'react';
import ApprovalQueue from './ApprovalQueue';

export default function CoworkDashboard() {
  // Mock data for the Approval Queue to demonstrate proactive agents
  const pendingActions = [
    {
      id: 'a1',
      actionType: 'Re-engage MICHAEL MESERVE — cooling Hot lead',
      payload: JSON.stringify({ message: 'Hi Michael, are you still interested in the Detroit properties?' })
    },
    {
      id: 'a2',
      actionType: 'Engage 17 new seller leads',
      payload: JSON.stringify({ task: 'Prep seller playbook and add to drip campaign' })
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Section: Greeting & AI Input */}
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Good morning, there <span className="text-blue-500">✨</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Tuesday, Sep 8 · Me - my business</p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-xl">+</span>
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-12 py-4 rounded-xl border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg"
            placeholder="Ask AiCRM anything or type / or @"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Middle Section: Proactive Agent Actions */}
      <section>
        <h2 className="text-xl font-bold mb-4">What Needs You Now</h2>
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex gap-4 text-sm">
            <button className="px-3 py-1 bg-gray-800 text-white rounded-full">All 2</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-full">Only you 1</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-full">Leads 1</button>
          </div>
          <div className="p-4">
            <ApprovalQueue 
              items={pendingActions} 
              onApprove={() => console.log('Approved')} 
              onReject={() => console.log('Rejected')} 
            />
          </div>
        </div>
      </section>

      {/* Bottom Section: My Business Metrics */}
      <section>
        <div className="flex gap-4 border-b mb-6">
          <button className="pb-2 border-b-2 border-gray-800 font-semibold">Overview</button>
          <button className="pb-2 text-gray-500 hover:text-gray-800">My Business</button>
          <button className="pb-2 text-gray-500 hover:text-gray-800">My Production</button>
        </div>

        <h2 className="text-xl font-bold mb-4">My Business</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-6 bg-white border rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Gci Vs Goal</p>
            <p className="text-3xl font-bold mt-2"></p>
            <button className="mt-4 px-4 py-1.5 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Set a goal</button>
          </div>
          <div className="p-6 bg-white border rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Closings</p>
            <p className="text-lg font-medium text-gray-400 mt-2">No closings yet.</p>
          </div>
          <div className="p-6 bg-white border rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Pipeline Value</p>
            <p className="text-lg font-medium text-gray-400 mt-2">No pipeline yet.</p>
          </div>
          <div className="p-6 bg-white border rounded-xl shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Speed → Lead</p>
            <p className="text-3xl font-bold mt-2">9h 30m</p>
            <p className="text-red-500 text-sm font-medium mt-2">slow <span className="text-gray-400">target 5m</span></p>
          </div>
        </div>
      </section>
    </div>
  );
}
