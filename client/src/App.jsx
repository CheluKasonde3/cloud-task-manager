import { useEffect, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { createTask as createTaskRequest, deleteTask as deleteTaskRequest, getTasks, isUsingMockApi, updateTask as updateTaskRequest } from "./api";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh({ showLoading = true } = {}) {
    if (showLoading) setLoading(true);
    try {
      setError("");
      setTasks(await getTasks());
    } catch (err) {
      setError(`Couldn't load tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getTasks()
      .then((loadedTasks) => {
        if (!cancelled) setTasks(loadedTasks);
      })
      .catch((err) => {
        if (!cancelled) setError(`Couldn't load tasks: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function act(action) {
    try {
      setError("");
      await action();
      await refresh({ showLoading: false });
      return true;
    } catch (err) {
      setError(`Couldn't save task: ${err.message}`);
      return false;
    }
  }

  function addTask(task) {
    return act(() => createTaskRequest(task));
  }

  function toggleTask(task) {
    return act(() => updateTaskRequest(task.id, { completed: !task.completed }));
  }

  function removeTask(id) {
    return act(() => deleteTaskRequest(id));
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <main className="app">
      <header className="page-header">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Task Manager</h1>
          <p className="counter">{tasks.length - completedCount} open · {completedCount} completed</p>
        </div>
      </header>

      {error && (
        <div className="error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">Dismiss</button>
        </div>
      )}

      <TaskForm onAdd={addTask} />

      {loading ? (
        <p className="empty" role="status">Loading tasks…</p>
      ) : error && tasks.length === 0 ? (
        <div className="empty-state">
          <p>Tasks couldn’t be loaded. Review the error above, then try again.</p>
          <button type="button" onClick={() => refresh()}>Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        <section className="empty-state" aria-label="No tasks">
          <h2>No tasks yet</h2>
          <p>Create your first task above to get started.</p>
        </section>
      ) : (
        <TaskList tasks={tasks} onToggle={toggleTask} onDelete={removeTask} />
      )}

      <p className="storage-note">
        {isUsingMockApi ? "Using mock API responses saved in this browser. Set VITE_API_URL to connect a backend." : ""}
      </p>
    </main>
  );
}
