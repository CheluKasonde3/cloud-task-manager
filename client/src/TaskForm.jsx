import { useState } from "react";

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setFormError("Title is required."); // blocked before any request
      return;
    }
    setFormError("");
    onAdd(title.trim(), description.trim());
    setTitle("");
    setDescription("");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title (required)"
        aria-label="Task title"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        aria-label="Task description"
        rows={2}
      />
      {formError && <p className="field-error">{formError}</p>}
      <button type="submit">Add task</button>
    </form>
  );
}