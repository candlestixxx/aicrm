const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const fixes = [
  { model: 'Brokerage', field: 'teams             Team[]' },
  { model: 'Brokerage', field: 'agents            Agent[]' },
  { model: 'Brokerage', field: 'pipelines         Pipeline[]' },
  { model: 'Brokerage', field: 'properties        Property[]' },
  { model: 'Brokerage', field: 'listingStatusLogs ListingStatusLog[]' },
  { model: 'Brokerage', field: 'secrets           Secret[]' },
  { model: 'Brokerage', field: 'approvalQueues    ApprovalQueue[]' },
  { model: 'Brokerage', field: 'agentAuditLogs    AgentAuditLog[]' },
  { model: 'Brokerage', field: 'vectorEmbeddings  VectorEmbedding[]' },
  { model: 'Contact', field: 'leads          Lead[]' },
  { model: 'Contact', field: 'properties     Property[]' },
  { model: 'Contact', field: 'tasks          Task[] @relation("TaskContact")' },
  { model: 'Contact', field: 'activities     Activity[]' },
  { model: 'Contact', field: 'communications Communication[]' },
  { model: 'WorkflowTrigger', field: 'workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)' },
  { model: 'WorkflowAction', field: 'workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)' },
  { model: 'Campaign', field: 'executionLogs CampaignExecutionLog[]' },
  { model: 'CampaignStep', field: 'executionLogs CampaignExecutionLog[]' },
];

for (const fix of fixes) {
  const modelRegex = new RegExp('model\\s+' + fix.model + '\\s*\\{');
  const match = modelRegex.exec(schema);
  if (!match) { console.log('MODEL NOT FOUND: ' + fix.model); continue; }
  let depth = 0;
  let pos = match.index + match[0].length - 1;
  let closePos = -1;
  for (let i = pos; i < schema.length; i++) {
    if (schema[i] === '{') depth++;
    if (schema[i] === '}') { depth--; if (depth === 0) { closePos = i; break; } }
  }
  if (closePos === -1) { console.log('CLOSE NOT FOUND: ' + fix.model); continue; }
  schema = schema.slice(0, closePos) + '  ' + fix.field + '\n' + schema.slice(closePos);
  console.log('Added to ' + fix.model + ': ' + fix.field.trim());
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Done. Schema updated.');
