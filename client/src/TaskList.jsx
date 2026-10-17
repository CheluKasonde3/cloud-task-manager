export default function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty">No tasks yet. Add your first one above.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className={task.completed ? "task done" : "task"}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
            aria-label={`Mark "${task.title}" ${
              task.completed ? "incomplete" : "complete"
            }`}
          />
          <div className="task-text">
            <strong>{task.title}</strong>
            {task.description && <span>{task.description}</span>}
          </div>
          <button className="delete" onClick={() => onDelete(task)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}