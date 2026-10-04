const fs = require('fs');
let s = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Brokerage: add brokerAgents Agent[] (agents name taken by AgentProfile[])
//    Agent.brokerage needs opposite — Prisma auto-pairs by type
s = s.replace(
  /(\n  vectorEmbeddings  VectorEmbedding\[\])/,
  '\n  brokerAgents      Agent[]\n  vectorEmbeddings  VectorEmbedding[]'
);

// 2. Agent.contacts Contact[] — Contact.agent is AgentProfile?, not Agent
//    Rename Agent.contacts to use a named relation, add matching field on Contact
s = s.replace(
  /(\n  )contacts         Contact\[\]/,
  '\n  managedContacts Contact[] @relation("AgentManagedContacts")'
);
// Add managerAgent to Contact (before closing brace of Contact)
s = s.replace(
  /(\n  communications Communication\[\])/,
  '\n  communications Communication[]\n  managerAgentId String?\n  managerAgent   Agent?   @relation("AgentManagedContacts", fields: [managerAgentId], references: [id], onDelete: SetNull)'
);

// 3. Agent.socialAccounts SocialAccount[] — SocialAccount has no agent field
//    Add agentId + agent to SocialAccount
s = s.replace(
  /(\n  posts        SocialPost\[\])/,
  '\n  agentId      String?\n  agent        Agent?    @relation(fields: [agentId], references: [id], onDelete: SetNull)\n  posts        SocialPost[]'
);

fs.writeFileSync('prisma/schema.prisma', s);
console.log('Schema fixed: 3 relation gaps patched');
