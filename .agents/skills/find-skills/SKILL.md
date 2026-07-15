---
name: find-skills
description: "Use to discover and route to the most relevant specialized agent skill out of 1,440+ options."
category: meta
risk: safe
source: community
date_added: "2026-07-08"
---

# find-skills

## Purpose

To provide a central router and search tool for finding the exact specialized skill you need among 1,440+ agent skills. This skill helps you locate, trigger, and load the domain-specific instruction set best suited for your task.

## When to Use This Skill

This skill should be used when:
- You need to find a skill for a specific task but don't know the exact name or path.
- You want to browse skills available in a particular category.
- You want to check what capabilities or triggers an existing skill has.
- You are initiating a complex multi-step workflow and need to load the correct helper skills.

## Core Capabilities

1. **Structured Categories** - All skills are organized into 21 high-level categories.
2. **Interactive CLI Router** - Search tool that dynamically queries skill names, descriptions, triggers, and tags.
3. **Trigger Resolution** - Identifies correct invocation commands (`@name`) and paths.

## Category Map

Here are the categories into which the skills have been organized:

| Category | Description |
|---|---|
| **[platform-azure](references/all_skills_detailed.md#platform-azure)** | Azure integrations, SDKs, and resource managers. |
| **[platform-odoo](references/all_skills_detailed.md#platform-odoo)** | Odoo modules, deployments, accounting, and configuration. |
| **[platform-makepad-robius](references/all_skills_detailed.md#platform-makepad-robius)** | Makepad and Robius frameworks for multi-platform UI/UX. |
| **[agent-frameworks-ai](references/all_skills_detailed.md#agent-frameworks-ai)** | AI agents, LLM integrations, prompts, MCP, and RAG. |
| **[cloud-devops-cicd](references/all_skills_detailed.md#cloud-devops-cicd)** | Cloud (AWS, GCP), Docker, Kubernetes, Terraform, Git, CI/CD, and Shell. |
| **[database-data-engineering](references/all_skills_detailed.md#database-data-engineering)** | SQL databases, Cosmos, migrations, dbt, and data pipelines. |
| **[frontend-ui-ux](references/all_skills_detailed.md#frontend-ui-ux)** | React, Angular, Vue, Tailwind, SwiftUI, general UI design, and animations. |
| **[backend-software-engineering](references/all_skills_detailed.md#backend-software-engineering)** | Backend frameworks, API design, testing, debugging, and languages. |
| **[security-compliance](references/all_skills_detailed.md#security-compliance)** | Pentesting, auditing, secure coding, vulnerabilities, and compliance. |
| **[business-marketing-seo](references/all_skills_detailed.md#business-marketing-seo)** | SEO, monetization, pricing, copywriting, legal documents, and startup analysis. |
| **[automation-integrations](references/all_skills_detailed.md#automation-integrations)** | Integrations for Google Workspace, Notion, Trello, Apify, and Zoom. |
| **[science-math-academic](references/all_skills_detailed.md#science-math-academic)** | Scientific Python libraries, math, statistics, and LaTeX conversion. |
| **[expert-personas-profiles](references/all_skills_detailed.md#expert-personas-profiles)** | Skills representing specific expert personas, historical figures, or industry leaders. |
| **[health-nutrition-fitness](references/all_skills_detailed.md#health-nutrition-fitness)** | Personal health, diet, nutrition, fitness, sleep, and rehabilitation analyzers. |
| **[writing-content-creation](references/all_skills_detailed.md#writing-content-creation)** | Tools for copywriting, professional editing, prose writing, content strategies, and academic publications. |
| **[system-architecture-patterns](references/all_skills_detailed.md#system-architecture-patterns)** | Software architecture, C4 context modeling, domain-driven design, and system patterns. |
| **[testing-qa-protocols](references/all_skills_detailed.md#testing-qa-protocols)** | Test-driven development, QA pipelines, debugging frameworks, and error diagnostic protocols. |
| **[graphics-3d-gamedev](references/all_skills_detailed.md#graphics-3d-gamedev)** | Game engines (Unity, Godot), 3D graphics, shader programming, and interactive media. |
| **[blockchain-web3-crypto](references/all_skills_detailed.md#blockchain-web3-crypto)** | Blockchain engineering, Solidity, smart contracts, DeFi templates, and cryptocurrency protocols. |
| **[productivity-workspace-docs](references/all_skills_detailed.md#productivity-workspace-docs)** | Workspace tools (Notion, Obsidian), document coauthoring, and productivity workflows. |
| **[general-utilities](references/all_skills_detailed.md#general-utilities)** | General CLI helpers, file organizer tools, generic readmes, and general-purpose templates. |

## How to Route & Find Skills

Run the interactive router tool inside this skill's scripts folder to find matches for any query:

```bash
python3 find-skills/scripts/router.py "<your query>"
```

### Examples:
- Find a database tool: `python3 find-skills/scripts/router.py "postgres index optimization"`
- Find Google sheets integration: `python3 find-skills/scripts/router.py "google sheets"`
- Find react performance checks: `python3 find-skills/scripts/router.py "react performance"`

## Detailed Reference

For a complete static list of all skills grouped by category, check the [all_skills_detailed.md](references/all_skills_detailed.md) file.
