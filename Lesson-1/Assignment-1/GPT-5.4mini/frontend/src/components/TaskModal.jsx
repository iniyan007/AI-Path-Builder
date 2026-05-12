import { useEffect, useState } from "react";
import { Modal } from "./Modal.jsx";
import { Button } from "./Button.jsx";
import { Input } from "./Input.jsx";
import { Select } from "./Select.jsx";

const emptyForm = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
  tags: "",
  projectId: "",
  workspaceId: ""
};

export function TaskModal({ open, onClose, onSave, workspaces = [], projects = [], initialTask }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        initialTask
          ? {
              title: initialTask.title || "",
              description: initialTask.description || "",
              priority: initialTask.priority || "medium",
              status: initialTask.status || "todo",
              dueDate: initialTask.dueDate ? new Date(initialTask.dueDate).toISOString().slice(0, 16) : "",
              tags: (initialTask.tags || []).join(", "),
              projectId: initialTask.project?._id || initialTask.project || "",
              workspaceId: initialTask.workspace?._id || initialTask.workspace || ""
            }
          : emptyForm
      );
    }
  }, [open, initialTask]);

  const submit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      workspaceId: form.workspaceId || workspaces[0]?._id || workspaces[0]?.id || "",
      projectId: form.projectId || null
    });
  };

  return (
    <Modal open={open} title={initialTask ? "Edit Task" : "Create Task"} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="split">
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Select>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </Select>
        </div>
        <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        <Input placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <div className="split">
          <Select value={form.workspaceId} onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}>
            {workspaces.map((workspace) => (
              <option key={workspace._id || workspace.id} value={workspace._id || workspace.id}>
                {workspace.name}
              </option>
            ))}
          </Select>
          <Select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project._id || project.id} value={project._id || project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="modal-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{initialTask ? "Save Changes" : "Create Task"}</Button>
        </div>
      </form>
    </Modal>
  );
}
