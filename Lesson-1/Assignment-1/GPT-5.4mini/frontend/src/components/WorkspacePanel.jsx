import { Button } from "./Button.jsx";
import { Select } from "./Select.jsx";

export function WorkspacePanel({ workspaces, activeWorkspaceId, onSelectWorkspace, onNewWorkspace, projects, activeProjectId, onSelectProject, onNewProject }) {
  return (
    <aside className="workspace-panel">
      <div className="panel-header">
        <h3>Workspaces</h3>
        <Button variant="ghost" onClick={onNewWorkspace}>
          New
        </Button>
      </div>
      <Select value={activeWorkspaceId || ""} onChange={(e) => onSelectWorkspace(e.target.value)}>
        {workspaces.map((workspace) => (
          <option key={workspace._id || workspace.id} value={workspace._id || workspace.id}>
            {workspace.name}
          </option>
        ))}
      </Select>

      <div className="panel-header">
        <h3>Projects</h3>
        <Button variant="ghost" onClick={onNewProject}>
          New
        </Button>
      </div>
      <Select value={activeProjectId || ""} onChange={(e) => onSelectProject(e.target.value)}>
        <option value="">All projects</option>
        {projects.map((project) => (
          <option key={project._id || project.id} value={project._id || project.id}>
            {project.name}
          </option>
        ))}
      </Select>
    </aside>
  );
}
