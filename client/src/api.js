import { loadTasks, normalizeTask, saveTasks } from "./taskStorage";

const BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");

export const isUsingMockApi = BASE === "";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Couldn't reach the task API. Check that the server is running and VITE_API_URL is correct.", { cause: err });
    }
    throw err;
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // Use the HTTP status when the server response has no JSON error message.
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

function unwrapTask(data) {
  return data?.task ?? data;
}

export async function getTasks() {
  if (isUsingMockApi) return loadTasks();

  const data = await request("/api/tasks");
  const tasks = Array.isArray(data) ? data : data?.tasks;
  if (!Array.isArray(tasks)) {
    throw new Error("The tasks API returned an invalid response.");
  }
  return tasks.map(normalizeTask);
}

export async function createTask(task) {
  if (isUsingMockApi) {
    const tasks = loadTasks();
    const created = { ...task, id: crypto.randomUUID() };
    saveTasks([created, ...tasks]);
    return created;
  }

  const created = unwrapTask(
    await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),
  );
  return created ? normalizeTask(created) : null;
}

export async function updateTask(id, updates) {
  if (isUsingMockApi) {
    const tasks = loadTasks();
    const index = tasks.findIndex((task) => task.id === id);
    if (index < 0) throw new Error("Task not found.");

    const updated = { ...tasks[index], ...updates };
    tasks[index] = updated;
    saveTasks(tasks);
    return updated;
  }

  const updated = unwrapTask(
    await request(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  );
  return updated ? normalizeTask(updated) : null;
}

export async function deleteTask(id) {
  if (isUsingMockApi) {
    const tasks = loadTasks();
    saveTasks(tasks.filter((task) => task.id !== id));
    return;
  }

  await request(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function deleteAllTasks(tasks) {
  if (isUsingMockApi) {
    saveTasks([]);
    return;
  }

  const results = await Promise.allSettled(
    tasks.map((task) => deleteTask(task.id)),
  );
  const failedCount = results.filter((result) => result.status === "rejected").length;
  if (failedCount > 0) {
    throw new Error(
      `${failedCount} of ${tasks.length} tasks could not be deleted. The list has been refreshed; try again for the remaining tasks.`,
    );
  }
}
