"use client";

import { useState, useEffect, useCallback } from "react";

type SocialAccount = {
  id: string;
  platform: string;
  profileName: string | null;
};

type SocialPost = {
  id: string;
  content: string;
  status: string;
  account: { platform: string; profileName: string | null };
};

export default function SocialStudio({ tenantId }: { tenantId: string }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [accRes, postRes] = await Promise.all([
        fetch(`/api/social/oauth?tenantId=${tenantId}`),
        fetch(`/api/social/posts?tenantId=${tenantId}`)
      ]);

      if (accRes.ok) setAccounts((await accRes.json()).accounts);
      if (postRes.ok) setPosts((await postRes.json()).posts);
    } catch (error) {
      console.error("Failed to fetch social data", error);
    }
  }, [tenantId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [accRes, postRes] = await Promise.all([
          fetch(`/api/social/oauth?tenantId=${tenantId}`),
          fetch(`/api/social/posts?tenantId=${tenantId}`)
        ]);
        if (isMounted && accRes.ok) setAccounts((await accRes.json()).accounts);
        if (isMounted && postRes.ok) setPosts((await postRes.json()).posts);
      } catch (e) { console.error(e); }
    };
    load();
    return () => { isMounted = false; };
  }, [tenantId]);

  const connectAccount = async (platform: string) => {
    try {
      const res = await fetch("/api/social/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, platform }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || accounts.length === 0) return;

    setIsLoading(true);
    try {
      const platforms = accounts.map(a => a.platform);
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, topic, platforms }),
      });

      if (!res.ok) throw new Error("Failed to generate content");
      setTopic("");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to generate agentic content.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Agentic Social Studio</h2>
      <p className="text-sm text-gray-600 mb-6">
        Connect platforms and let AI research, write, and schedule your omnichannel marketing.
      </p>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Connected Accounts</h3>
        <div className="flex flex-wrap gap-2">
          {["FACEBOOK", "INSTAGRAM", "LINKEDIN"].map(platform => {
            const isConnected = accounts.some(a => a.platform === platform);
            return (
              <button
                key={platform}
                onClick={() => !isConnected && connectAccount(platform)}
                className={`px-4 py-2 text-xs font-semibold rounded border ${isConnected ? 'bg-blue-50 border-blue-200 text-blue-700 cursor-default' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                {platform} {isConnected && "✓"}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleGenerateContent} className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Agentic Content Creator</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='Topic (e.g., "Detroit interest rate updates")'
            className="flex-1 px-4 py-2 border rounded-lg text-sm"
            disabled={isLoading || accounts.length === 0}
          />
          <button
            type="submit"
            disabled={isLoading || !topic.trim() || accounts.length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? "Researching & Writing..." : "Generate & Stage"}
          </button>
        </div>
        {accounts.length === 0 && <p className="text-xs text-red-500 mt-2">Connect at least one social account first.</p>}
      </form>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Generated Content Drafts</h3>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {posts.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No content drafted yet.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">{post.account.platform}</span>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{post.status}</span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
