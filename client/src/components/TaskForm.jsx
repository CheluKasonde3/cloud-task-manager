import { useState } from "react";

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");
  const [formError, setFormError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setFormError("A task title is required.");
      return;
    }

    const saved = await onAdd({
      title: title.trim(),
      description: description.trim(),
      dueDate,
      project: project.trim(),
      category: category.trim(),
      priority,
      assignee: assignee.trim(),
      status: "pending",
      comments: [],
      attachments: [],
    });
    if (!saved) return;

    setTitle("");
    setDescription("");
    setDueDate("");
    setProject("");
    setCategory("");
    setPriority("medium");
    setAssignee("");
    setFormError("");
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>Create a task</h2>
      <label>
        Task title
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to get done?"
        />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add useful details"
          rows={2}
        />
      </label>
      <div className="form-grid">
        <label>
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
        <label>
          Project
          <input
            value={project}
            onChange={(event) => setProject(event.target.value)}
            placeholder="e.g. Website launch"
          />
        </label>
        <label>
          Category
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="e.g. Design"
          />
        </label>
        <label>
          Priority
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Assign to
          <input
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="Team member"
          />
        </label>
      </div>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <button type="submit">Add task</button>
    </form>
  );
}
