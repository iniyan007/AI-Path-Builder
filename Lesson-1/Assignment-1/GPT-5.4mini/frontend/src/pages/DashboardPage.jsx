import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/endpoints.js";
import { useAuthStore } from "../store/authStore.js";
import { useUiStore } from "../store/uiStore.js";
import { Button } from "../components/Button.jsx";
import { TaskCard } from "../components/TaskCard.jsx";
import { TaskModal } from "../components/TaskModal.jsx";
import { WorkspacePanel } from "../components/WorkspacePanel.jsx";
import { NotificationsPanel } from "../components/NotificationsPanel.jsx";
import { StatCard } from "../components/StatCard.jsx";

const columns = [
  { key: "todo", label: "Todo" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const [filters, setFilters] = useState({ workspaceId: "", projectId: "", status: "", priority: "", search: "" });
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [dragTask, setDragTask] = useState(null);
  const [workspaceDialog, setWorkspaceDialog] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);

  const workspacesQuery = useQuery({ queryKey: ["workspaces"], queryFn: api.workspaces });
  const activeWorkspaceId = filters.workspaceId || workspacesQuery.data?.data?.[0]?._id || "";
  const projectsQuery = useQuery({
    queryKey: ["projects", activeWorkspaceId],
    queryFn: () => api.projects(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId)
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => api.tasks(filters),
    enabled: Boolean(activeWorkspaceId)
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: api.notifications,
    refetchInterval: 45000
  });
  const analyticsQuery = useQuery({
    queryKey: ["analytics", activeWorkspaceId],
    queryFn: () => api.analytics(activeWorkspaceId),
    enabled: Boolean(activeWorkspaceId)
  });

  useEffect(() => {
    if (!filters.workspaceId && workspacesQuery.data?.data?.length) {
      setFilters((current) => ({ ...current, workspaceId: workspacesQuery.data.data[0]._id }));
    }
  }, [filters.workspaceId, workspacesQuery.data]);

  const createTask = useMutation({
    mutationFn: api.createTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setTaskModalOpen(false);
    }
  });
  const updateTask = useMutation({
    mutationFn: ({ id, payload }) => api.updateTask(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setEditingTask(null);
      setTaskModalOpen(false);
    }
  });
  const deleteTask = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
  });
  const moveStatus = useMutation({
    mutationFn: ({ id, status }) => api.updateTaskStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
  });
  const markNotification = useMutation({
    mutationFn: api.markNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });
  const markAllNotifications = useMutation({
    mutationFn: api.markAllNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });
  const createWorkspace = useMutation({
    mutationFn: api.createWorkspace,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] })
  });
  const createProject = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });

  const tasks = tasksQuery.data?.data || [];
  const workspaces = workspacesQuery.data?.data || [];
  const projects = projectsQuery.data?.data || [];
  const notifications = notificationsQuery.data?.data || [];
  const stats = analyticsQuery.data?.data || { todo: 0, inProgress: 0, review: 0, done: 0, total: 0 };

  const grouped = useMemo(
    () =>
      columns.reduce((acc, column) => {
        acc[column.key] = tasks.filter((task) => task.status === column.key);
        return acc;
      }, {}),
    [tasks]
  );

  const handleSaveTask = async (payload) => {
    const base = {
      workspaceId: payload.workspaceId,
      projectId: payload.projectId || null,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      status: payload.status,
      dueDate: payload.dueDate,
      tags: payload.tags
    };
    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask._id || editingTask.id, payload: base });
    } else {
      await createTask.mutateAsync(base);
    }
  };

  const handleDrop = async (event, status) => {
    event.preventDefault();
    if (dragTask) {
      await moveStatus.mutateAsync({ id: dragTask._id || dragTask.id, status });
      setDragTask(null);
    }
  };

  const newWorkspace = async () => {
    const name = window.prompt("Workspace name", `${user?.name || "My"} Workspace`);
    if (name) await createWorkspace.mutateAsync({ name, description: "" });
  };

  const newProject = async () => {
    const name = window.prompt("Project name", "Launch Plan");
    if (name) await createProject.mutateAsync({ workspaceId: activeWorkspaceId, name, color: "#38bdf8", description: "" });
  };

  const updateFilters = (next) => setFilters((current) => ({ ...current, ...next }));

  if (!workspacesQuery.data?.data) {
    return <main className="dashboard-shell loading-shell">Loading dashboard...</main>;
  }

  return (
    <main className={`dashboard-shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ET</div>
          <div>
            <strong>Enterprise Todo</strong>
            <p>{user?.name}</p>
          </div>
        </div>
        <WorkspacePanel
          workspaces={workspaces}
          activeWorkspaceId={filters.workspaceId}
          onSelectWorkspace={(workspaceId) => updateFilters({ workspaceId })}
          onNewWorkspace={newWorkspace}
          projects={projects}
          activeProjectId={filters.projectId}
          onSelectProject={(projectId) => updateFilters({ projectId })}
          onNewProject={newProject}
        />
        <div className="sidebar-actions">
          <Button onClick={() => setTaskModalOpen(true)}>New Task</Button>
          <Button variant="ghost" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button variant="ghost" onClick={async () => { await logout(); navigate("/login"); }}>
            Log out
          </Button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations dashboard</p>
            <h1>Track everything that matters.</h1>
          </div>
          <div className="searchbar">
            <input
              className="field"
              placeholder="Search tasks"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>
        </header>

        <section className="stats-grid">
          <StatCard label="Total Tasks" value={stats.total} hint="Across active workspace" />
          <StatCard label="Todo" value={stats.todo} hint="Waiting to be started" />
          <StatCard label="In Progress" value={stats.inProgress} hint="Currently being worked on" />
          <StatCard label="Done" value={stats.done} hint="Completed items" />
        </section>

        <section className="board-grid">
          <div className="kanban-board">
            {columns.map((column) => (
              <div key={column.key} className="kanban-column" onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, column.key)}>
                <div className="panel-header">
                  <h3>{column.label}</h3>
                  <span>{grouped[column.key]?.length || 0}</span>
                </div>
                <div className="kanban-list">
                  {(grouped[column.key] || []).map((task) => (
                    <TaskCard
                      key={task._id || task.id}
                      task={task}
                      onDragStart={(_event, item) => setDragTask(item)}
                      onEdit={(item) => {
                        setEditingTask(item);
                        setTaskModalOpen(true);
                      }}
                      onDelete={(item) => deleteTask.mutate(item._id || item.id)}
                      onToggleStatus={(item) => {
                        const next = item.status === "todo" ? "in-progress" : item.status === "in-progress" ? "review" : item.status === "review" ? "done" : "todo";
                        moveStatus.mutate({ id: item._id || item.id, status: next });
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="right-rail">
            <NotificationsPanel
              notifications={notifications}
              onMark={(id) => markNotification.mutate(id)}
              onMarkAll={() => markAllNotifications.mutate()}
            />
            <section className="activity-card">
              <div className="panel-header">
                <h3>Productivity</h3>
                <span>{tasks.length} open tasks</span>
              </div>
              <div className="activity-bars">
                {(analyticsQuery.data?.data || []).slice(0, 7).map((item, index) => (
                  <div key={`${item.day}-${index}`} className="activity-row">
                    <span>{item.day}</span>
                    <div className="activity-bar">
                      <div className={`activity-fill ${item.status}`} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </section>

      <TaskModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        workspaces={workspaces}
        projects={projects}
        initialTask={editingTask}
      />
    </main>
  );
}
