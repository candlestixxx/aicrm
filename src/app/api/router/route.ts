import { NextRequest, NextResponse } from 'next/server';

// Tier 1: Fast/Cheap models for basic tasks (data formatting, scrubbing)
const TIER_1_MODELS = ['Gemini Flash', 'Qwen'];

// Tier 2: Frontier models for complex reasoning (negotiation, drafting)
const TIER_2_MODELS = ['GPT-4o', 'Claude 3.5'];

// Keywords that indicate complex reasoning is required
const COMPLEX_TASK_KEYWORDS = [
    'negotiate', 'draft', 'strategy', 'analyze', 'advise',
    'reasoning', 'complex', 'contract', 'proposal'
];

interface RouterRequest {
    task: string;
    context?: unknown;
    preferredModel?: string; // Optional user override
}

/**
 * HyperNexus MCP Routing Logic
 * Determines the appropriate model tier based on task complexity.
 */
function evaluateTaskComplexity(task: string): number {
    const lowerTask = task.toLowerCase();

    // Check if task contains keywords indicating complexity
    const isComplex = COMPLEX_TASK_KEYWORDS.some(keyword => lowerTask.includes(keyword));

    return isComplex ? 2 : 1;
}

export async function POST(request: NextRequest) {
    try {
        const body: RouterRequest = await request.json();

        if (!body.task) {
            return NextResponse.json({ error: 'Task description is required' }, { status: 400 });
        }

        // Assess task to determine tier
        const requiredTier = evaluateTaskComplexity(body.task);

        let selectedModel = '';
        let reasoning = '';

        if (body.preferredModel) {
            selectedModel = body.preferredModel;
            reasoning = `User explicitly requested ${body.preferredModel}`;
        } else if (requiredTier === 1) {
            // In a real implementation, we would check the Vault for which Tier 1 keys are available
            selectedModel = TIER_1_MODELS[0]; // Defaulting to Gemini Flash for example
            reasoning = 'Task assessed as simple data processing. Routing to Tier 1 model for cost efficiency and speed.';
        } else {
            // Complex task, route to Tier 2
            selectedModel = TIER_2_MODELS[0]; // Defaulting to GPT-4o for example
            reasoning = 'Task assessed as complex reasoning. Escalating to Tier 2 frontier model.';
        }

        return NextResponse.json({
            task: body.task,
            assignedTier: requiredTier,
            selectedModel: selectedModel,
            routingReasoning: reasoning,
            // In a real execution, we would call the actual LLM API here
            // after retrieving and decrypting the key from the Vault
            status: 'routed_successfully'
        });

    } catch (error) {
        console.error('Error in HyperNexus Router:', error);
        return NextResponse.json({ error: 'Failed to process routing request' }, { status: 500 });
    }
}
