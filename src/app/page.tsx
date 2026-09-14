import ModelManager from '@/components/ModelManager';
import ContactManager from '@/components/ContactManager';
import WorkflowManager from '@/components/WorkflowManager';

export default function Home() {
  // Using a dummy tenant ID for local MVP testing
  const dummyTenantId = "tenant-123";

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <ModelManager />
        <ContactManager />
        <WorkflowManager tenantId={dummyTenantId} />
      </div>
    </main>
  );
}
