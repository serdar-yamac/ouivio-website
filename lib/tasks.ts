export type Task = {
  id: string;
  title: string;
  meta: string;
  done: boolean;
  dueDate: string | null;
  createdAt: string;
};

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function headers(accessToken: string) {
  return {
    apikey: supabaseAnonKey ?? "",
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    meta: row.notes ?? "",
    done: row.is_done,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase ist nicht konfiguriert.");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(accessToken), ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Supabase-Anfrage fehlgeschlagen (${response.status}).`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function fetchTasks(accessToken: string, weddingId: string): Promise<Task[]> {
  const rows = await request<TaskRow[]>(`tasks?select=*&wedding_id=eq.${encodeURIComponent(weddingId)}&order=created_at.asc`, accessToken);
  return rows.map(mapTask);
}

export async function createTask(accessToken: string, weddingId: string, input: Pick<Task, "title" | "meta" | "dueDate">): Promise<Task> {
  const rows = await request<TaskRow[]>("tasks", accessToken, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ wedding_id: weddingId, title: input.title, notes: input.meta || null, due_date: input.dueDate }),
  });
  return mapTask(rows[0]);
}

export async function updateTask(accessToken: string, task: Task): Promise<Task> {
  const rows = await request<TaskRow[]>(`tasks?id=eq.${encodeURIComponent(task.id)}`, accessToken, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ title: task.title, notes: task.meta || null, due_date: task.dueDate, is_done: task.done }),
  });
  return mapTask(rows[0]);
}

export async function deleteTask(accessToken: string, id: string): Promise<void> {
  await request<void>(`tasks?id=eq.${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}
