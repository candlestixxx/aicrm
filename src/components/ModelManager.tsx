'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Server, Zap, Brain, Check, X, Key, Info } from 'lucide-react';

type Provider = 'OpenAI' | 'Google Gemini' | 'Anthropic' | 'DeepSeek' | 'Qwen' | 'Xiaomi' | 'Hermes Agent' | 'OpenClaw';

interface ProviderState {
    provider: Provider;
    isConfigured: boolean;
    isLocal: boolean;
    tier: 'Frontier (Tier 2)' | 'Fast (Tier 1)' | 'Local orchestrator';
}

const INITIAL_PROVIDERS: ProviderState[] = [
    { provider: 'OpenAI', isConfigured: false, isLocal: false, tier: 'Frontier (Tier 2)' },
    { provider: 'Anthropic', isConfigured: false, isLocal: false, tier: 'Frontier (Tier 2)' },
    { provider: 'Google Gemini', isConfigured: false, isLocal: false, tier: 'Fast (Tier 1)' },
    { provider: 'DeepSeek', isConfigured: false, isLocal: false, tier: 'Frontier (Tier 2)' },
    { provider: 'Qwen', isConfigured: false, isLocal: false, tier: 'Fast (Tier 1)' },
    { provider: 'Xiaomi', isConfigured: false, isLocal: false, tier: 'Fast (Tier 1)' },
    { provider: 'Hermes Agent', isConfigured: false, isLocal: true, tier: 'Local orchestrator' },
    { provider: 'OpenClaw', isConfigured: false, isLocal: true, tier: 'Local orchestrator' },
];

export default function ModelManager() {
    const [providers, setProviders] = useState<ProviderState[]>(INITIAL_PROVIDERS);
    const [activeProvider, setActiveProvider] = useState<Provider | null>(null);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Fetch configured providers on load
    useEffect(() => {
        const fetchConfiguredKeys = async () => {
            try {
                const response = await fetch('/api/vault');
                if (response.ok) {
                    const data = await response.json();
                    const configuredList = data.configuredProviders.map((p: { provider: string }) => p.provider);

                    setProviders(prev => prev.map(p => ({
                        ...p,
                        isConfigured: configuredList.includes(p.provider)
                    })));
                }
            } catch (error) {
                console.error("Failed to load configured providers", error);
            }
        };
        fetchConfiguredKeys();
    }, []);

    const handleConnect = (provider: Provider) => {
        setActiveProvider(provider);
        setApiKeyInput('');
        setMessage(null);
    };

    const handleSaveKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeProvider || (!apiKeyInput && !providers.find(p => p.provider === activeProvider)?.isLocal)) return;

        setIsSaving(true);
        setMessage(null);

        try {
            // For local orchestrators, we might just toggle them on without a key
            const payload = {
                provider: activeProvider,
                key: apiKeyInput || 'local-enabled-no-key-required'
            };

            const response = await fetch('/api/vault', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setProviders(prev => prev.map(p =>
                    p.provider === activeProvider ? { ...p, isConfigured: true } : p
                ));
                setMessage({ text: `Successfully connected to ${activeProvider}`, type: 'success' });
                setTimeout(() => setActiveProvider(null), 2000);
            } else {
                const error = await response.json();
                setMessage({ text: error.error || 'Failed to save key', type: 'error' });
            }
        } catch {
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisconnect = async (provider: Provider) => {
        try {
            const response = await fetch(`/api/vault?provider=${provider}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setProviders(prev => prev.map(p =>
                    p.provider === provider ? { ...p, isConfigured: false } : p
                ));
            }
        } catch (error) {
             console.error("Failed to disconnect", error);
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 text-gray-800">
            {/* Header Section */}
            <div className="space-y-4">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Server className="w-8 h-8 text-blue-600" />
                    Model Manager & API Vault
                </h1>
                <p className="text-gray-600 max-w-3xl text-lg">
                    Manage your AI connections securely. We use a Bring-Your-Own-Key (BYOK) architecture.
                    Your keys are kept strictly server-side in a secure, encrypted PostgreSQL vault and are never exposed to the frontend or saved in version control.
                </p>
            </div>

            {/* Educational / Tutorial Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    How HyperNexus Routing Saves You Money
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold">Tier 1: Fast & Cheap Models</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            HyperNexus automatically routes simple tasks (like formatting data, scrubbing contacts, and basic categorization) to high-speed, low-cost models like <strong>Gemini Flash</strong> or <strong>Qwen</strong>.
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-5 h-5 text-purple-500" />
                            <h3 className="font-bold">Tier 2: Frontier Reasoning</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                            When a workflow requires deep contextual understanding (like drafting a complex negotiation email or analyzing legal language), HyperNexus escalates the task to elite models like <strong>GPT-4o</strong> or <strong>Claude 3.5</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Connection Grid */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-600" />
                        Secure API Connections
                    </h2>
                </div>

                <div className="divide-y divide-gray-100">
                    {providers.map((p) => (
                        <div key={p.provider} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-gray-50">
                            <div>
                                <h3 className="font-bold text-lg">{p.provider}</h3>
                                <p className="text-sm text-gray-500">{p.tier}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                {p.isConfigured ? (
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                                            <Check className="w-4 h-4 mr-1" /> Connected
                                        </span>
                                        <button
                                            onClick={() => handleDisconnect(p.provider)}
                                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConnect(p.provider)}
                                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal for adding keys */}
            {activeProvider && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Connect {activeProvider}</h3>
                            <button onClick={() => setActiveProvider(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveKey} className="p-6 space-y-4">
                            {!providers.find(p => p.provider === activeProvider)?.isLocal && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        API Key
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="password"
                                            required
                                            value={apiKeyInput}
                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder={`Enter your ${activeProvider} key...`}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                                        <Shield className="w-3 h-3" /> Key will be encrypted and stored securely.
                                    </p>
                                </div>
                            )}

                            {providers.find(p => p.provider === activeProvider)?.isLocal && (
                                <p className="text-sm text-gray-600">
                                    This is a local MCP orchestrator. Ensure it is running on your local machine to establish the connection. No API key is required.
                                </p>
                            )}

                            {message && (
                                <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setActiveProvider(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isSaving ? 'Connecting...' : 'Securely Connect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
