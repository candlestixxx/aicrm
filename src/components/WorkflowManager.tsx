"use client";

import { useState, useEffect } from "react";

type Workflow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggers: { id: string; type: string; config: unknown }[];
  actions: { id: string; type: string; config: unknown; orderIndex: number }[];
};

export default function WorkflowManager({ tenantId }: { tenantId: string }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkflows = async () => {
      try {
        const res = await fetch(`/api/workflows?tenantId=${tenantId}`);
        if (!res.ok) throw new Error("Failed to fetch workflows");
        const data = await res.json();
        if (isMounted) {
          setWorkflows(data.workflows);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchWorkflows();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, prompt }),
      });

      if (!res.ok) throw new Error("Failed to generate workflow");

      setPrompt("");
      // Refresh list after generation
      const refreshRes = await fetch(`/api/workflows?tenantId=${tenantId}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setWorkflows(data.workflows);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate workflow. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Agentic Automation Engine</h2>
      <p className="text-sm text-gray-600 mb-6">
        Describe the automation you want in plain English, and HyperNexus will build it.
      </p>

      <form onSubmit={handleGenerate} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g., "If a lead replies Yes, update their stage to Hot and email the broker"'
            className="flex-1 px-4 py-2 border rounded-lg text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? "Generating..." : "Generate Workflow"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Active Workflows</h3>
        {workflows.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No workflows created yet.</p>
        ) : (
          workflows.map((wf) => (
            <div key={wf.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{wf.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{wf.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${wf.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {wf.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Triggers</h5>
                  <ul className="text-sm space-y-1">
                    {wf.triggers.map((t) => (
                      <li key={t.id} className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                        ⚡ {t.type} {t.config ? <span className="text-xs text-gray-400">({String(JSON.stringify(t.config))})</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Actions</h5>
                  <ul className="text-sm space-y-1">
                    {wf.actions.map((a) => (
                      <li key={a.id} className="bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                        ➡️ {a.type} {a.config ? <span className="text-xs text-gray-400">({String(JSON.stringify(a.config))})</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
