import { Button } from "./Button.jsx";

export function NotificationsPanel({ notifications, onMark, onMarkAll }) {
  return (
    <section className="notifications-panel">
      <div className="panel-header">
        <h3>Notifications</h3>
        <Button variant="ghost" onClick={onMarkAll}>
          Mark all read
        </Button>
      </div>
      <div className="notification-list">
        {notifications.map((item) => (
          <button key={item._id} className={`notification-item ${item.readAt ? "read" : ""}`} onClick={() => onMark(item._id)}>
            <strong>{item.title}</strong>
            <span>{item.message}</span>
          </button>
        ))}
        {!notifications.length ? <p className="empty-state">No notifications yet.</p> : null}
      </div>
    </section>
  );
}
