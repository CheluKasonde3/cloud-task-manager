import { useEffect, useRef, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { createTask as createTaskRequest, deleteAllTasks as deleteAllTasksRequest, deleteTask as deleteTaskRequest, getTasks, isUsingMockApi, updateTask as updateTaskRequest } from "./api";

const columns = [
  { status: "pending", label: "To do" },
  { status: "in-progress", label: "In progress" },
  { status: "completed", label: "Completed" },
];

function todayAsString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function getDueState(dueDate) {
  if (!dueDate) return "";
  if (dueDate < todayAsString()) return "overdue";
  if (dueDate === todayAsString()) return "due-today";
  return "";
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const notifiedTaskIds = useRef(new Set());
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return undefined;
    }

    const checkDueTasks = () => {
      for (const task of tasks) {
        if (
          task.status !== "completed" &&
          task.dueDate &&
          task.dueDate <= todayAsString() &&
          !notifiedTaskIds.current.has(task.id)
        ) {
          const timing = getDueState(task.dueDate) === "overdue" ? "Overdue" : "Due today";
          new Notification(timing, { body: task.title });
          notifiedTaskIds.current.add(task.id);
        }
      }
    };

    checkDueTasks();
    const timer = window.setInterval(checkDueTasks, 60_000);
    return () => window.clearInterval(timer);
  }, [tasks]);

  async function act(action) {
    try {
      setError("");
      await action();
      await refresh({ showLoading: false });
      return true;
    } catch (err) {
      try {
        setTasks(await getTasks());
      } catch {
        // Keep the original mutation error visible when refreshing also fails.
      }
      setError(`Couldn't save task: ${err.message}`);
      return false;
    }
  }

  function updateTask(id, updates) {
    return act(() => updateTaskRequest(id, updates));
  }

  function addTask(task) {
    return act(() => createTaskRequest(task));
  }

  function removeTask(id) {
    return act(() => deleteTaskRequest(id));
  }

  async function removeAllTasks() {
    const deleted = await act(() => deleteAllTasksRequest(tasks));
    setConfirmDeleteAll(false);
    return deleted;
  }

  async function enableReminders() {
    if (!("Notification" in window)) {
      setError("This browser doesn't support desktop notifications. In-app due-date reminders are still available.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setError("");
      } else if (permission === "denied") {
        setError("Notifications are blocked in your browser settings. In-app due-date reminders are still available.");
      } else {
        setError("Notification permission wasn't granted. In-app due-date reminders are still available.");
      }
    } catch (err) {
      setError(`Couldn't enable notifications: ${err.message}`);
    }
  }

  const projects = [...new Set(tasks.map((task) => task.project).filter(Boolean))].sort();
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const dueTasks = openTasks.filter((task) => task.dueDate && task.dueDate <= todayAsString());
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  function matchesFilters(task) {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [task.title, task.description, task.project, task.category, task.assignee]
        .some((value) => value.toLowerCase().includes(query));
    return (
      matchesSearch &&
      (!projectFilter || task.project === projectFilter) &&
      (!priorityFilter || task.priority === priorityFilter)
    );
  }

  return (
    <main className="app">
      <header className="page-header">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Task Manager</h1>
          <p className="counter">
            {openTasks.length} open · {completedCount} completed
          </p>
        </div>
        <button className="reminder-button" type="button" onClick={enableReminders}>
          Enable browser reminders
        </button>
      </header>

      {dueTasks.length > 0 && (
        <section className="due-summary" aria-label="Upcoming reminders">
          <strong>{dueTasks.length} task{dueTasks.length === 1 ? "" : "s"} need attention</strong>
          <span>
            {dueTasks.some((task) => getDueState(task.dueDate) === "overdue")
              ? "You have overdue work. Check the task cards below."
              : "Some tasks are due today. Check the task cards below."}
          </span>
        </section>
      )}

      {error && (
        <div className="error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            Dismiss
          </button>
        </div>
      )}

      <TaskForm onAdd={addTask} />

      <section className="filters" aria-label="Filter tasks">
        <input
          aria-label="Search tasks"
          placeholder="Search tasks…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          aria-label="Filter by project"
          value={projectFilter}
          onChange={(event) => setProjectFilter(event.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>
        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
        >
          <option value="">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </section>

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
        <>
          <section className="bulk-actions" aria-label="Task actions">
            {confirmDeleteAll ? (
              <>
                <p>
                  Delete all {tasks.length} task{tasks.length === 1 ? "" : "s"}? This cannot be undone.
                </p>
                <button
                  className="delete-all-confirm"
                  type="button"
                  onClick={removeAllTasks}
                >
                  Confirm delete all
                </button>
                <button
                  className="delete-all-cancel"
                  type="button"
                  onClick={() => setConfirmDeleteAll(false)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="delete-all-button"
                type="button"
                onClick={() => setConfirmDeleteAll(true)}
              >
                Delete all tasks
              </button>
            )}
          </section>
          <section className="board" aria-label="Tasks by status">
            {columns.map(({ status, label }) => {
              const visibleTasks = tasks.filter(
                (task) => task.status === status && matchesFilters(task),
              );
              return (
                <section className="board-column" key={status} aria-label={label}>
                  <h2>
                    {label}
                    <span className="column-count">{visibleTasks.length}</span>
                  </h2>
                  <TaskList
                    tasks={visibleTasks}
                    onUpdate={updateTask}
                    onDelete={removeTask}
                    getDueState={getDueState}
                  />
                </section>
              );
            })}
          </section>
        </>
      )}
      <p className="storage-note">
        {isUsingMockApi
          ? "Using mock API responses saved in this browser. Set VITE_API_URL to connect a backend."
          : ""}
      </p>
    </main>
  );
}
