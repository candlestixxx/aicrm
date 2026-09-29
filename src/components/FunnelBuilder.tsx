"use client";

import { useState, useEffect, useCallback } from "react";

type LandingPage = {
  id: string;
  name: string;
  slug: string;
  published: boolean;
};

type Funnel = {
  id: string;
  name: string;
  domain: string | null;
  pages: LandingPage[];
};

export default function FunnelBuilder({ tenantId }: { tenantId: string }) {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [newFunnelName, setNewFunnelName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchFunnels = useCallback(async () => {
    try {
      const res = await fetch(`/api/funnels?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch funnels");
      const data = await res.json();
      setFunnels(data.funnels);
    } catch (error) {
      console.error(error);
    }
  }, [tenantId]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await fetch(`/api/funnels?tenantId=${tenantId}`);
        if (!res.ok) throw new Error("Failed to fetch funnels");
        const data = await res.json();
        if (isMounted) setFunnels(data.funnels);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [tenantId]);

  const handleCreateFunnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFunnelName.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, name: newFunnelName }),
      });

      if (!res.ok) throw new Error("Failed to create funnel");
      setNewFunnelName("");
      fetchFunnels();
    } catch (error) {
      console.error(error);
      alert("Failed to create funnel.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Funnel & Landing Page Builder</h2>
      <p className="text-sm text-gray-600 mb-6">
        Create custom single-property sites and lead capture funnels.
      </p>

      <form onSubmit={handleCreateFunnel} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newFunnelName}
            onChange={(e) => setNewFunnelName(e.target.value)}
            placeholder="e.g., 123 Main St Open House"
            className="flex-1 px-4 py-2 border rounded-lg text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newFunnelName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Funnel"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {funnels.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No funnels created yet.</p>
        ) : (
          funnels.map((funnel) => (
            <div key={funnel.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">{funnel.name}</h3>
                {funnel.domain && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{funnel.domain}</span>}
              </div>
              <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                {funnel.pages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{page.name} <span className="text-gray-400 font-normal">({page.slug})</span></span>
                    <span className={`text-xs px-2 py-1 rounded-full ${page.published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {page.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
