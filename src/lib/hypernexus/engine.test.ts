import { describe, it, expect } from 'vitest';
import { detectIntent, INTENT_RULES } from './engine';

describe('HyperNexus intent detection', () => {
  it('should detect update_lead_stage intent', () => {
    const result = detectIntent('update lead john-doe to hot');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('update_lead_stage');
    expect(result!.params['lead']).toBe('john-doe');
    expect(result!.params['stage']).toBe('hot');
  });

  it('should detect update_lead_stage with "set" phrasing', () => {
    const result = detectIntent('set lead jane stage to cold');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('update_lead_stage');
    expect(result!.params['stage']).toBe('cold');
  });

  it('should detect "mark as" phrasing', () => {
    const result = detectIntent('mark lead smith as closed won');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('update_lead_stage');
    expect(result!.params['stage']).toBe('closed won');
  });

  it('should detect create_task intent', () => {
    const result = detectIntent('create a task to call John about the offer');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('create_task');
    expect(result!.params['title']).toBe('call John about the offer');
  });

  it('should detect remind me phrasing', () => {
    const result = detectIntent('remind me to follow up with Sarah');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('create_task');
    expect(result!.params['title']).toBe('follow up with Sarah');
  });

  it('should detect list_contacts intent', () => {
    const result = detectIntent('list my contacts');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('list_contacts');
  });

  it('should detect summarize_brokerage intent', () => {
    const result = detectIntent('summarize my brokerage');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('summarize_brokerage');
  });

  it('should detect send_communication intent', () => {
    const result = detectIntent('send email to john-doe saying hello there');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('send_communication');
    expect(result!.params['channel']).toBe('email');
    expect(result!.params['contact']).toBe('john-doe');
  });

  it('should return null for unknown commands', () => {
    const result = detectIntent('tell me a joke about houses');
    expect(result).toBeNull();
  });

  it('should have all rules with unique intents', () => {
    const intents = INTENT_RULES.map((r) => r.intent);
    expect(new Set(intents).size).toBe(intents.length);
  });

  it('should have non-empty patterns for each rule', () => {
    for (const rule of INTENT_RULES) {
      expect(rule.patterns.length).toBeGreaterThan(0);
      expect(rule.execute).toBeTypeOf('function');
    }
  });
});
