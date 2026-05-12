# Assignment 1: AI Model Comparison for an Enterprise MERN To-Do Application

## Prompt Evaluated

```txt
You are a professional full-stack-developer who is building a Enterprice level application now your task is to make a to-do application with the tech stack MERN
you need to build a whole application from the scratch the application should be ready to deploy and contains all the features
```

## Scope

The models were compared for an enterprise-level MERN to-do application: MongoDB, Express.js, React, and Node.js. The expected output was not only task CRUD, but also production readiness: authentication, validation, security middleware, clean API structure, deployment configuration, and maintainable frontend/backend separation.

Primary department relevance: AppDev code generation.

Secondary department relevance: Data SQL/query generation and DevOps infrastructure automation.

## Model Comparison Table

| Model | Code Quality | SQL Generation | Infra Automation | Ease of Use | Speed/Latency | Comments |
| --- | --- | --- | --- | --- | --- | --- |
| GPT-4o | Excellent | Good | Good | Excellent | Good | Strong for full-stack planning, API structure, React/Express patterns, documentation, and implementation guidance. Best suited when the goal is a balanced production-ready application with clear developer handoff. |
| Claude Sonnet | Excellent | Good | Excellent | Good | Good | Produced the most enterprise-focused plan: JWT auth, RBAC, workspaces, projects, notifications, analytics, Swagger docs, rate limiting, logging, Docker, and Nginx. Very strong for AppDev and DevOps-heavy architecture, but the output is larger and needs careful implementation review. |
| Gemini Flash | Good | Basic | Basic | Excellent | Excellent | Fast and simple. Generated a usable MERN starter with auth, task CRUD, Vite frontend, and Axios integration. Best for quick prototypes, but it missed many enterprise requirements such as RBAC, audit logs, tests, deployment hardening, and deeper security controls. |
| deepseek-r1:7b on Ollama | Basic | Basic | Basic | Basic | Good | Useful as a local/offline model, but the reviewed response confused MERN with React Native and suggested incorrect or unnecessary dependencies. It can help with brainstorming and small local tasks, but enterprise code generation requires strong human review and correction. |

## Department Use-Case Summary

| Department | Use Case | Best Model Choice | Reason |
| --- | --- | --- | --- |
| AppDev | Code Generation | Claude Sonnet or GPT-4o | Both models produced the strongest application architecture and code organization for a MERN project. Claude Sonnet leaned more enterprise-heavy, while GPT-4o is easier to consolidate into clean implementation steps. |
| Data | Data Analysis & SQL Generation | GPT-4o or Claude Sonnet | The assignment app mainly uses MongoDB, but for SQL-style reasoning, schema explanation, and query generation, GPT-4o and Claude Sonnet are more reliable than Gemini Flash and the local DeepSeek response. |
| DevOps | Infrastructure Automation | Claude Sonnet | Claude Sonnet included the strongest production-readiness checklist: Docker, Nginx, health checks, logging, environment configuration, rate limiting, and API documentation. |

## Final Conclusion

For building a deployable enterprise MERN to-do application, Claude Sonnet gave the most complete enterprise architecture, while GPT-4o is the best all-around choice for clear full-stack implementation and consolidation. Gemini Flash is useful when speed matters and the goal is a lightweight prototype. The local model, deepseek-r1:7b on Ollama, is valuable for privacy and offline experimentation, but its response was not reliable enough for a production-grade MERN build without significant developer correction.

Recommended final approach: use Claude Sonnet or GPT-4o for the main enterprise implementation, Gemini Flash for rapid UI/API prototyping, and deepseek-r1:7b only as a local assistant for smaller isolated tasks.

## Reviewed Repository Outputs

| Folder | Observation |
| --- | --- |
| `Claud-Sonnet/To-Do-List` | Enterprise-oriented backend structure with workspaces, projects, analytics, notifications, security middleware, Swagger config, and Zustand-based frontend stores. |
| `Gemini-Flash/To-Do-List` | Simpler MERN app with authentication pages, dashboard, task API, and a polished Vite frontend, but fewer enterprise and deployment features. |
| `GPT-5.4mini` | Complete full-stack implementation with Docker Compose, Nginx config, backend tests, Swagger support, auth, workspaces, projects, notifications, analytics, and reusable frontend components. |
| `Deepseek-r1/DEEPSEEKRESPONSE.md` | Local-model response showed reasoning effort, but contained technical drift and inaccurate MERN assumptions, so it scored lower for production readiness. |

## Local Model Note

The local reference model can be tested through Ollama:

```bash
ollama run deepseek-r1:7b
```

For REST usage, Ollama exposes local endpoints such as model generation APIs. This is helpful for private local experimentation, but production app decisions should still be reviewed by an experienced developer.
