import { useState } from "react";

function formatDueDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readAttachment(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 250_000) {
      reject(new Error(`${file.name} is larger than the 250 KB attachment limit.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Couldn't read ${file.name}.`));
        return;
      }
      resolve({
        name: file.name,
        type: file.type || "application/octet-stream",
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function TaskCard({ task, onUpdate, onDelete, getDueState }) {
  const [comment, setComment] = useState("");
  const [assignee, setAssignee] = useState(task.assignee);
  const [attachmentError, setAttachmentError] = useState("");
  const dueState = getDueState(task.dueDate);

  async function addComment(event) {
    event.preventDefault();
    const text = comment.trim();
    if (!text) return;
    const saved = await onUpdate(task.id, {
      comments: [...task.comments, { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }],
    });
    if (saved) setComment("");
  }

  async function addAttachments(event) {
    const files = [...event.target.files];
    event.target.value = "";
    setAttachmentError("");
    try {
      const attachments = await Promise.all(files.map(readAttachment));
      await onUpdate(task.id, { attachments: [...task.attachments, ...attachments] });
    } catch (err) {
      setAttachmentError(err.message);
    }
  }

  function removeAttachment(index) {
    onUpdate(task.id, {
      attachments: task.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
    });
  }

  return (
    <article className={`task-card${dueState ? ` ${dueState}` : ""}`}>
      <div className="card-heading">
        <div>
          <h3>{task.title}</h3>
          {task.description && <p className="description">{task.description}</p>}
        </div>
        <span className={`priority priority-${task.priority}`}>{task.priority}</span>
      </div>

      <div className="task-tags">
        {task.project && <span>{task.project}</span>}
        {task.category && <span>{task.category}</span>}
        {task.assignee && <span>Assigned to {task.assignee}</span>}
        {task.dueDate && (
          <span className={dueState || ""}>
            {dueState === "overdue" ? "Overdue · " : dueState === "due-today" ? "Due today · " : "Due "}
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>

      <div className="card-controls">
        <label>
          Status
          <select
            aria-label={`Status for ${task.title}`}
            value={task.status}
            onChange={(event) => onUpdate(task.id, { status: event.target.value })}
          >
            <option value="pending">To do</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label>
          Assignee
          <input
            aria-label={`Assignee for ${task.title}`}
            value={assignee}
            placeholder="Unassigned"
            onChange={(event) => setAssignee(event.target.value)}
            onBlur={() => {
              if (assignee !== task.assignee) onUpdate(task.id, { assignee });
            }}
          />
        </label>
      </div>

      <details className="collaboration">
        <summary>
          Discussion &amp; files
          <span>{task.comments.length} comments · {task.attachments.length} files</span>
        </summary>
        {task.comments.length > 0 && (
          <ul className="comment-list">
            {task.comments.map((item) => (
              <li key={item.id}>
                <p>{item.text}</p>
                <time dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
        <form className="comment-form" onSubmit={addComment}>
          <label className="visually-hidden" htmlFor={`comment-${task.id}`}>Add a comment</label>
          <input
            id={`comment-${task.id}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write a comment…"
          />
          <button type="submit">Comment</button>
        </form>
        <label className="file-picker">
          Attach files (up to 250 KB each)
          <input type="file" multiple onChange={addAttachments} />
        </label>
        {attachmentError && <p className="field-error" role="alert">{attachmentError}</p>}
        {task.attachments.length > 0 && (
          <ul className="attachment-list">
            {task.attachments.map((attachment, index) => (
              <li key={`${attachment.name}-${index}`}>
                <a href={attachment.dataUrl} download={attachment.name}>{attachment.name}</a>
                <button type="button" className="remove-attachment" onClick={() => removeAttachment(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </details>

      <button className="delete-button" type="button" onClick={() => onDelete(task.id)}>
        Delete task
      </button>
    </article>
  );
}

export default function TaskList({ tasks, onUpdate, onDelete, getDueState }) {
  if (tasks.length === 0) {
    return <p className="empty">No matching tasks. Add a task or adjust your filters.</p>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
          getDueState={getDueState}
        />
      ))}
    </div>
  );
}
