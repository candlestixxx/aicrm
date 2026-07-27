# aicrm# Agentic Real Estate CRM 🏢🤖

A multi-tenant, agentic Customer Relationship Management (CRM) platform built specifically for real estate professionals. 

This platform matches the deep, industry-specific functionalities of platforms like Lofty with the elite marketing automation of GoHighLevel—delivered through a simplified, natural-language interface. Instead of forcing users to build complex node-graph automations, this CRM is powered natively by the **Model Context Protocol (MCP)**, allowing AI agents to securely interact with the database and execute workflows autonomously.

---

## 🧠 1. The Orchestration Layer (HyperNexus)

Instead of traditional, rigid API scripts, the CRM’s central nervous system is powered by **HyperNexus**. 

* **Natural Language Workflows:** Users type plain-English commands (e.g., *"If a lead replies 'Yes', update their stage to 'Hot' and draft an email to the broker"*), and HyperNexus translates that intent into executable backend database hooks.
* **Autonomous Operation:** HyperNexus acts as a universal adapter. It empowers AI agents to directly query the CRM database, update pipeline stages, and trigger communications without manual user input.

## 🔀 2. The Multi-Model Router & API Vault

We do not lock users into a single AI provider. The platform uses a **Tiered Routing Architecture** to maximize capability while minimizing API costs.

* **Secure API Vault:** A highly secure, encrypted database where users plug in their own API keys (OpenAI, Google Gemini, Anthropic, DeepSeek, Qwen, Xiaomi) or connect local tools (Hermes Agent, OpenClaw). *Note: Keys are kept strictly server-side and are always excluded from version control.*
* **Smart Tiering:** The system automatically assigns fast, low-cost models (e.g., Gemini Flash, Qwen) to basic tasks like data formatting, and escalates complex reasoning tasks (e.g., drafting negotiation responses) to frontier models (e.g., GPT-4o, Claude 3.5).
* **Built-in Education:** The UI features plain-English tutorials explaining what API keys are and how the MCP routing system saves users money.

## 🏘️ 3. Core Real Estate Features (Lofty Parity)

Before the AI steps in, the platform functions as a robust, compliant real estate database.

* **Smart Contact Management:** Detailed lead profiles, CSV import/export tools, and dynamic "Smart Filter" segments.
* **Automated Enrichment:** A background web-scrubbing agent autonomously hunts for missing contact details on new leads.
* **Industry Compliance:** Database schemas mapped directly to local MLS standards, complete with Agent, Team, and Brokerage hierarchy profiles.
* **Funnel & Page Builder:** Tools to build custom landing pages and Single Property Sites with built-in analytics and event tracking.

## 📱 4. The Social Studio & Marketing Engine

A dedicated module to handle brand awareness and lead generation across multiple channels.

* **Omnichannel Marketing:** Smart drip campaigns managing both SMS and Email, along with custom text-code generation for physical property signs.
* **Agentic Content Creator:** Users connect Facebook, Instagram, LinkedIn, YouTube, and Google Business via OAuth. When a user inputs a topic (e.g., *"Detroit interest rate updates"*), the AI researches the data, writes the copy, generates or attaches a reel/image, and schedules the post universally.

## 📞 5. Future-Proofing: Phase 2 "LEADG" Integration

This CRM is architected from day one to support **LEADG**—an upcoming AI-automated voice dialing agent.

* **Telephony Architecture:** The initial database schema includes strict states for call logging, disposition tracking, and transcription storage.
* **WebRTC Ready:** The backend is pre-configured with websocket endpoints designed to accept bi-directional audio streams, allowing the LEADG voice agent to drop into the CRM seamlessly upon deployment.
