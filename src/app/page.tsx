'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Users, Building2, TrendingUp, Calendar, Settings,
  LogOut, Menu, X, Home, BarChart3, CheckSquare,
  Megaphone, Sparkles, ShieldCheck, BookOpen, HelpCircle,
} from 'lucide-react';
import ContactList from '@/components/ContactList';
import ModelManager from '@/components/ModelManager';
import PipelineBoard from '@/components/PipelineBoard';
import TaskManager from '@/components/TaskManager';
import PropertyManager from '@/components/PropertyManager';
import TeamManager from '@/components/TeamManager';
import CampaignManager from '@/components/CampaignManager';
import HyperNexusConsole from '@/components/HyperNexusConsole';
import HyperNexusGuide from '@/components/HyperNexusGuide';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import ToolCatalog from '@/components/ToolCatalog';
import SwarmConsole from '@/components/SwarmConsole';
import HyperNexusDashboard from '@/components/HyperNexusDashboard';
import Vault from '@/components/Vault';
import AssistantPanel from '@/components/AssistantPanel';
import EngineSelector from '@/components/EngineSelector';
import UserGuide from '@/components/UserGuide';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import HelpCenter from '@/components/HelpCenter';
import HelpChat from '@/components/HelpChat';
import OnboardingTour from '@/components/OnboardingTour';

type Tab =
  | 'guide'
  | 'assistant'
  | 'dashboard'
  | 'contacts'
  | 'pipeline'
  | 'tasks'
  | 'properties'
  | 'campaigns'
  | 'team'
  | 'hypernexus'
  | 'models'
  | 'vault'
  | 'help'
  | 'settings';

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  agentProfile?: {
    brokerage: { name: string };
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nexusView, setNexusView] = useState<'assistant' | 'control'>('assistant');
  const [tourOpen, setTourOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const fetcher = (url: string) => fetch(url).then((r) => r.json());

  const { data: userData } = useSWR<SessionUser>('/api/auth/me', fetcher);
  const { data: statsData } = useSWR<{ pagination: { total: number } }>(
    '/api/contacts?limit=1',
    fetcher
  );

  const stats = {
    totalContacts: statsData?.pagination?.total ?? 0,
    activeLeads: 0,
    closedThisMonth: 0,
    upcomingTasks: 0,
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Auto-start the guided tour on first visit (deferred so the dashboard paints first).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem('aicrm-tour-seen')) {
      const t = setTimeout(() => setTourOpen(true), 300);
      return () => clearTimeout(t);
    }
  }, []);

  const handleTourClose = () => {
    setTourOpen(false);
    if (typeof window !== 'undefined') localStorage.setItem('aicrm-tour-seen', '1');
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'guide', label: 'Guide & Demo', icon: <BookOpen className="w-5 h-5" /> },
    { key: 'assistant', label: 'AI Assistant', icon: <Sparkles className="w-5 h-5" /> },
    { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { key: 'hypernexus', label: 'HyperNexus', icon: <Sparkles className="w-5 h-5" /> },
    { key: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" /> },
    { key: 'pipeline', label: 'Pipeline', icon: <TrendingUp className="w-5 h-5" /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { key: 'properties', label: 'Properties', icon: <Building2 className="w-5 h-5" /> },
    { key: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" /> },
    { key: 'team', label: 'Team', icon: <Users className="w-5 h-5" /> },
    { key: 'models', label: 'AI Models', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'vault', label: 'Vault', icon: <ShieldCheck className="w-5 h-5" /> },
    { key: 'help', label: 'Help', icon: <HelpCircle className="w-5 h-5" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900">AiCRM</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}

          <hr className="my-4" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface border-b border-gray-200 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900">
              {userData?.agentProfile?.brokerage?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            {userData && (
              <span className="text-sm text-gray-600">
                {userData.name || userData.email}
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'guide' && <UserGuide />}

          {activeTab === 'assistant' && <AssistantPanel />}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Contacts</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-surface rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active Leads</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeLeads}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-surface rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Closed This Month</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.closedThisMonth}</p>
                    </div>
                    <Home className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
                <div className="bg-surface rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Upcoming Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.upcomingTasks}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Recent Contacts */}
              <div className="bg-surface rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Welcome to AiCRM</h2>
                <p className="text-gray-600 mb-4">
                  Your agentic real estate CRM is ready. Get started by:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Adding contacts — manually or via CSV import</li>
                  <li>Connecting your AI models in the <strong>AI Models</strong> tab</li>
                  <li>Setting up your pipeline stages in <strong>Settings</strong></li>
                  <li>Creating drip campaigns to nurture leads</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'hypernexus' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setNexusView('assistant')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    nexusView === 'assistant'
                      ? 'bg-purple-600 text-white'
                      : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Assistant & Workflows
                </button>
                <button
                  onClick={() => setNexusView('control')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    nexusView === 'control'
                      ? 'bg-purple-600 text-white'
                      : 'bg-surface border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Control Plane
                </button>
              </div>

              {nexusView === 'assistant' ? (
                <>
                  <HyperNexusGuide />
                  <HyperNexusConsole />
                  <WorkflowBuilder />
                </>
              ) : (
                <>
                  <ToolCatalog />
                  <SwarmConsole />
                  <HyperNexusDashboard />
                </>
              )}
            </div>
          )}

          {activeTab === 'contacts' && <ContactList />}

          {activeTab === 'pipeline' && <PipelineBoard />}

          {activeTab === 'tasks' && <TaskManager />}

          {activeTab === 'properties' && <PropertyManager />}

          {activeTab === 'campaigns' && <CampaignManager />}

          {activeTab === 'team' && <TeamManager />}

          {activeTab === 'models' && <ModelManager />}

          {activeTab === 'vault' && <Vault />}

          {activeTab === 'help' && (
            <HelpCenter onStartTour={() => setTourOpen(true)} onOpenChat={() => setChatOpen(true)} />
          )}

          {activeTab === 'settings' && (
            <div className="bg-surface rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900">Brokerage</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {userData?.agentProfile?.brokerage?.name || 'Loading...'}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900">User Profile</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {userData?.email} — Role: {userData?.role}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900">Pipeline Configuration</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Default pipeline stages: New Lead → Contacted → Showing Scheduled → Offer Made → Negotiation → Closed
                  </p>
                </div>
                <EngineSelector />
              </div>
            </div>
          )}
        </main>
      </div>

      <HelpChat
        open={chatOpen}
        onOpenChange={setChatOpen}
        onStartTour={() => setTourOpen(true)}
        onOpenHelp={() => setActiveTab('help')}
      />
      <OnboardingTour open={tourOpen} onClose={handleTourClose} />
    </div>
  );
}
