const STORAGE_KEY = "task-manager.tasks.v2";

export function normalizeTask(task) {
  if (!task || typeof task !== "object" || typeof task.title !== "string") {
    throw new Error("Saved task data is invalid. Your saved tasks were left unchanged.");
  }

  return {
    id: task.id ?? crypto.randomUUID(),
    title: task.title,
    description: typeof task.description === "string" ? task.description : "",
    completed: task.completed === true,
    created_at: typeof task.created_at === "string" ? task.created_at : new Date().toISOString(),
  };
}

export function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) return [];

  let parsed;
  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error("Saved task data couldn't be read. Your saved tasks were left unchanged.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Saved task data has an unexpected format. Your saved tasks were left unchanged.");
  }
  return parsed.map(normalizeTask);
}

export function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.map(normalizeTask)));
}
