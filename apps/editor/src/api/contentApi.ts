import type { AppContent } from "../types/content";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchDraft(): Promise<AppContent> {
  return handle<AppContent>(await fetch("/api/draft"));
}

export async function saveDraft(content: AppContent): Promise<void> {
  await handle<{ ok: boolean }>(
    await fetch("/api/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    })
  );
}

export async function publishDraft(): Promise<{ message?: string }> {
  return handle<{ ok: boolean; message?: string }>(
    await fetch("/api/publish", { method: "POST" })
  );
}

export async function fetchPublished(): Promise<AppContent> {
  return handle<AppContent>(await fetch("/api/published"));
}

export async function uploadMedia(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  return handle<{ url: string }>(
    await fetch("/api/media", { method: "POST", body: form })
  );
}
