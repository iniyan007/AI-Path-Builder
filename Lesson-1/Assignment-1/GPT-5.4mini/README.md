# Enterprise MERN Todo

Production-ready MERN todo application with:

- JWT authentication with refresh tokens
- Workspace and project management
- Task CRUD with subtasks, comments, tags, soft delete, and activity logs
- Kanban-style board with drag and drop
- Notifications and dashboard analytics
- Swagger docs and health checks
- Docker and Nginx deployment files

## Quick Start

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API

- Health: `GET /api/health`
- Docs: `GET /api/docs`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Tasks: `GET /api/tasks`, `POST /api/tasks`

