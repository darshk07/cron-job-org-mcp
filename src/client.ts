import type { DetailedJob, Folder, HistoryItem, Job } from "./types.js";

const BASE_URL = "https://api.cron-job.org";

export class CronJobApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`cron-job.org API error ${status}: ${body || "(empty body)"}`);
    this.name = "CronJobApiError";
  }
}

export class CronJobClient {
  constructor(private apiKey: string) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new CronJobApiError(res.status, text);
    }
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  }

  listJobs(): Promise<{ jobs: Job[]; someFailed: boolean }> {
    return this.request("GET", "/jobs");
  }

  getJob(jobId: number): Promise<{ jobDetails: DetailedJob }> {
    return this.request("GET", `/jobs/${jobId}`);
  }

  createJob(job: DetailedJob): Promise<{ jobId: number }> {
    return this.request("PUT", "/jobs", { job });
  }

  updateJob(jobId: number, job: Partial<DetailedJob>): Promise<Record<string, never>> {
    return this.request("PATCH", `/jobs/${jobId}`, { job });
  }

  deleteJob(jobId: number): Promise<Record<string, never>> {
    return this.request("DELETE", `/jobs/${jobId}`);
  }

  getJobHistory(jobId: number): Promise<{ history: HistoryItem[]; predictions: number[] }> {
    return this.request("GET", `/jobs/${jobId}/history`);
  }

  getHistoryItem(jobId: number, identifier: string): Promise<{ jobHistoryDetails: HistoryItem }> {
    return this.request("GET", `/jobs/${jobId}/history/${identifier}`);
  }

  listFolders(): Promise<{ folders: Folder[] }> {
    return this.request("GET", "/folders");
  }

  getFolder(folderId: number): Promise<{ folderDetails: Folder }> {
    return this.request("GET", `/folders/${folderId}`);
  }

  createFolder(title: string): Promise<{ folderId: number }> {
    return this.request("PUT", "/folders", { folder: { title } });
  }

  updateFolder(folderId: number, title: string): Promise<Record<string, never>> {
    return this.request("PATCH", `/folders/${folderId}`, { folder: { title } });
  }

  deleteFolder(folderId: number): Promise<Record<string, never>> {
    return this.request("DELETE", `/folders/${folderId}`);
  }
}
