import { useState } from "react";

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setFormError("A task title is required.");
      return;
    }

    setFormError("");
    const saved = await onAdd({ title: cleanTitle, description: description.trim() });
    if (!saved) return;
    setTitle("");
    setDescription("");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>Create a task</h2>
      <label>
        Task title
        <input type="text" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to get done?" />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add useful details" rows={2} />
      </label>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <button type="submit">Add task</button>
    </form>
  );
}
