import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create demo brokerage
  const brokerage = await prisma.brokerage.upsert({
    where: { slug: 'demo-realty' },
    update: {},
    create: {
      name: 'Demo Realty Group',
      slug: 'demo-realty',
      address: '123 Main St',
      phone: '(555) 555-5555',
      website: 'https://demorealty.example.com',
      mlsId: 'DEMO-MLS-001',
    },
  });

  console.log('Created brokerage:', brokerage.name);

  // Create demo user + agent
  const passwordHash = await bcrypt.hash('demo-password', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@aicrm.com' },
    update: {},
    create: {
      email: 'demo@aicrm.com',
      passwordHash,
      name: 'Demo Agent',
      role: 'admin',
    },
  });

  const agent = await prisma.agent.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      brokerageId: brokerage.id,
      licenseNumber: 'LIC-12345',
      mlsAgentId: 'MLS-AGENT-001',
      title: 'Licensed Real Estate Agent',
      phone: '(555) 123-4567',
      bio: 'Dedicated to helping clients find their dream home.',
    },
  });

  console.log('Created agent:', user.name);

  // Create default pipeline
  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'demo-pipeline' },
    update: {},
    create: {
      id: 'demo-pipeline',
      name: 'Default Pipeline',
      brokerageId: brokerage.id,
      isDefault: true,
    },
  });

  const stageNames = [
    { name: 'New Lead', order: 0, color: '#6b7280' },
    { name: 'Contacted', order: 1, color: '#3b82f6' },
    { name: 'Showing Scheduled', order: 2, color: '#8b5cf6' },
    { name: 'Offer Made', order: 3, color: '#f59e0b' },
    { name: 'Negotiation', order: 4, color: '#ef4444' },
    { name: 'Closed Won', order: 5, color: '#10b981' },
    { name: 'Closed Lost', order: 6, color: '#6b7280' },
  ];

  for (const stage of stageNames) {
    await prisma.pipelineStage.upsert({
      where: { id: `demo-stage-${stage.order}` },
      update: {},
      create: {
        id: `demo-stage-${stage.order}`,
        pipelineId: pipeline.id,
        ...stage,
      },
    });
  }

  console.log('Created pipeline with 7 stages');

  // Create demo contacts
  const demoContacts = [
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@example.com',
      phone: '(555) 234-5678',
      city: 'Detroit',
      state: 'MI',
      source: 'website',
      status: 'hot',
      tags: '["first-time-buyer","pre-approved"]',
    },
    {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@example.com',
      phone: '(555) 345-6789',
      city: 'Ann Arbor',
      state: 'MI',
      source: 'referral',
      status: 'active',
      tags: '["investor","multi-family"]',
    },
    {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.r@example.com',
      phone: '(555) 456-7890',
      city: 'Dearborn',
      state: 'MI',
      source: 'zillow',
      status: 'new',
      tags: '["relocating"]',
    },
    {
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@example.com',
      phone: '(555) 567-8901',
      city: 'Royal Oak',
      state: 'MI',
      source: 'open_house',
      status: 'cold',
      tags: '[]',
    },
    {
      firstName: 'Jessica',
      lastName: 'Williams',
      email: 'jessica.w@example.com',
      phone: '(555) 678-9012',
      city: 'Troy',
      state: 'MI',
      source: 'facebook',
      status: 'closed_won',
      tags: '["past-client"]',
    },
  ];

  for (const c of demoContacts) {
    const { status, tags, ...contactData } = c;
    await prisma.contact.create({
      data: {
        ...contactData,
        brokerageId: brokerage.id,
        assignedAgentId: agent.id,
        tags,
        isLead: true,
        lead: {
          create: {
            status,
            pipelineId: pipeline.id,
            stageId: 'demo-stage-' + (status === 'new' ? 0 : status === 'cold' ? 1 : status === 'closed_won' ? 5 : 2),
            propertyType: contactData.firstName === 'Michael' ? 'multi_family' : 'single_family',
            timeline: 'immediate',
          },
        },
      },
    });
  }

  console.log('Created 5 demo contacts');

  // Create demo properties
  const demoProperties = [
    {
      mlsNumber: 'DEMO-1001',
      address: '123 Main St',
      city: 'Detroit',
      state: 'MI',
      zip: '48201',
      propertyType: 'single_family',
      listPrice: 249900,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      status: 'active',
    },
    {
      mlsNumber: 'DEMO-1002',
      address: '456 Oak Ave',
      city: 'Ann Arbor',
      state: 'MI',
      zip: '48103',
      propertyType: 'condo',
      listPrice: 189000,
      bedrooms: 2,
      bathrooms: 1.5,
      squareFeet: 1100,
      status: 'pending',
    },
    {
      mlsNumber: 'DEMO-1003',
      address: '789 Lake Dr',
      city: 'Royal Oak',
      state: 'MI',
      zip: '48067',
      propertyType: 'single_family',
      listPrice: 425000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2800,
      status: 'active',
    },
  ];

  for (const p of demoProperties) {
    await prisma.property.create({
      data: {
        ...p,
        brokerageId: brokerage.id,
        listingAgentId: agent.id,
        listedDate: new Date(),
        description: 'Beautiful property in a great neighborhood.',
      },
    });
  }

  console.log('Created 3 demo properties');
  console.log('Seed complete!');
  console.log('');
  console.log('Demo login:');
  console.log('  Email: demo@aicrm.com');
  console.log('  Password: demo-password');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
