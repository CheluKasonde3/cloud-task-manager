const STORAGE_KEY = "task-manager.tasks.v2";
const MAX_STORAGE_CHARACTERS = 3_500_000;

export function normalizeTask(task) {
  if (!task || typeof task !== "object" || typeof task.title !== "string") {
    throw new Error("Saved task data is invalid. Your saved tasks were left unchanged.");
  }

  const status =
    task.status === "pending" || task.status === "in-progress" || task.status === "completed"
      ? task.status
      : task.completed
        ? "completed"
        : "pending";

  return {
    id: typeof task.id === "string" ? task.id : crypto.randomUUID(),
    title: task.title,
    description: typeof task.description === "string" ? task.description : "",
    dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
    project: typeof task.project === "string" ? task.project : "",
    category: typeof task.category === "string" ? task.category : "",
    priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
    assignee: typeof task.assignee === "string" ? task.assignee : "",
    status,
    comments: Array.isArray(task.comments)
      ? task.comments.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.text === "string" &&
            typeof item.createdAt === "string",
        )
      : [],
    attachments: Array.isArray(task.attachments)
      ? task.attachments.filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            typeof item.type === "string" &&
            typeof item.dataUrl === "string",
        )
      : [],
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
  const serialized = JSON.stringify(tasks);
  if (serialized.length > MAX_STORAGE_CHARACTERS) {
    throw new Error("The app's storage limit was reached. Remove some attachments or tasks to save changes.");
  }
  localStorage.setItem(STORAGE_KEY, serialized);
}
