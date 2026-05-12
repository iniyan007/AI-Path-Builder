import { motion } from "framer-motion";

const colors = {
  low: "#38bdf8",
  medium: "#f59e0b",
  high: "#fb7185",
  critical: "#ef4444"
};

export function TaskCard({ task, onEdit, onDelete, onToggleStatus, onDragStart }) {
  return (
    <motion.article
      className="task-card"
      draggable
      onDragStart={(event) => onDragStart?.(event, task)}
      whileHover={{ y: -2 }}
      layout
    >
      <div className="task-card-top">
        <span className="pill" style={{ background: colors[task.priority] || colors.medium }}>
          {task.priority}
        </span>
        <span className="task-date">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</span>
      </div>
      <h4>{task.title}</h4>
      <p>{task.description || "No description provided."}</p>
      <div className="task-meta">
        <span>{task.project?.name || "General"}</span>
        <span>{task.subtasks?.length || 0} subtasks</span>
      </div>
      <div className="task-actions">
        <button className="text-btn" onClick={() => onToggleStatus(task)}>
          Move
        </button>
        <button className="text-btn" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button className="text-btn danger" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </motion.article>
  );
}
