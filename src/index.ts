#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CronJobApiError, CronJobClient } from "./client.js";
import type { DetailedJob } from "./types.js";

const apiKey = process.env.CRONJOB_API_KEY;
if (!apiKey) {
  console.error(
    "Missing CRONJOB_API_KEY environment variable. Get an API key from " +
      "https://console.cron-job.org/ (Settings > API) and set it before starting this server.",
  );
  process.exit(1);
}

const client = new CronJobClient(apiKey);

const server = new McpServer({
  name: "cronjob-org-mcp",
  version: "0.1.0",
});

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message = err instanceof CronJobApiError ? err.message : String(err instanceof Error ? err.message : err);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const scheduleShape = {
  timezone: z.string().optional().describe("PHP timezone identifier, e.g. 'Europe/Berlin' or 'UTC'"),
  expiresAt: z
    .number()
    .int()
    .optional()
    .describe("Date/time (in job's timezone) after which the job expires, format YYYYMMDDhhmmss; 0 or omit = never"),
  hours: z.array(z.number().int()).optional().describe("Hours to run on, 0-23. [-1] means every hour."),
  mdays: z.array(z.number().int()).optional().describe("Days of month to run on, 1-31. [-1] means every day."),
  minutes: z.array(z.number().int()).optional().describe("Minutes to run on, 0-59. [-1] means every minute."),
  months: z.array(z.number().int()).optional().describe("Months to run on, 1-12. [-1] means every month."),
  wdays: z
    .array(z.number().int())
    .optional()
    .describe("Days of week to run on, 0=Sunday..6=Saturday. [-1] means every day."),
};

const authShape = {
  enable: z.boolean().optional().describe("Enable HTTP basic auth for this job"),
  user: z.string().optional(),
  password: z.string().optional(),
};

const notificationShape = {
  onFailure: z.boolean().optional(),
  onFailureCount: z.number().int().min(1).optional(),
  onSuccess: z.boolean().optional(),
  onDisable: z.boolean().optional(),
  onSslCertExpiry: z.boolean().optional(),
  onSslCertExpirySeconds: z.number().int().optional(),
};

const jobFieldsShape = {
  url: z.string().describe("Target URL the job requests"),
  enabled: z.boolean().optional().describe("Whether the job is active (default true)"),
  title: z.string().optional().describe("Human-readable job name"),
  saveResponses: z.boolean().optional().describe("Save response headers/body for each execution"),
  requestTimeout: z.number().int().optional().describe("Seconds before the request is aborted"),
  redirectSuccess: z.boolean().optional().describe("Treat 3xx redirects as success"),
  folderId: z.number().int().optional().describe("Folder to place the job in"),
  requestMethod: z
    .number()
    .int()
    .min(0)
    .max(8)
    .optional()
    .describe("0=GET 1=POST 2=OPTIONS 3=HEAD 4=PUT 5=DELETE 6=TRACE 7=CONNECT 8=PATCH"),
  schedule: z.object(scheduleShape).optional(),
  auth: z.object(authShape).optional(),
  notification: z.object(notificationShape).optional(),
  headers: z.record(z.string(), z.string()).optional().describe("Extra request headers to send"),
  body: z.string().optional().describe("Request body to send (for POST/PUT/PATCH)"),
};

function toDetailedJob(input: z.infer<z.ZodObject<typeof jobFieldsShape>>): DetailedJob {
  const { headers, body, ...rest } = input;
  const job = { ...rest } as DetailedJob;
  if (headers !== undefined || body !== undefined) {
    job.extendedData = {
      ...(headers !== undefined ? { headers } : {}),
      ...(body !== undefined ? { body } : {}),
    };
  }
  return job;
}

server.registerTool(
  "list_jobs",
  {
    title: "List cron jobs",
    description: "List all cron jobs in the cron-job.org account.",
    inputSchema: {},
  },
  async () => {
    try {
      return textResult(await client.listJobs());
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "get_job",
  {
    title: "Get cron job details",
    description: "Get full details (including auth, notifications, headers, body) for one cron job by ID.",
    inputSchema: { jobId: z.number().int().describe("The job's numeric ID") },
  },
  async ({ jobId }) => {
    try {
      return textResult(await client.getJob(jobId));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "create_job",
  {
    title: "Create a cron job",
    description:
      "Create a new cron job on cron-job.org. Only 'url' is mandatory; omitted schedule fields default to " +
      "'every unit' ([-1]), so an empty schedule runs every minute of every day.",
    inputSchema: jobFieldsShape,
  },
  async (input) => {
    try {
      const job = toDetailedJob(input);
      return textResult(await client.createJob(job));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "update_job",
  {
    title: "Update a cron job",
    description: "Update an existing cron job. Only include the fields you want to change.",
    inputSchema: { jobId: z.number().int().describe("The job's numeric ID"), ...jobFieldsShape },
  },
  async ({ jobId, ...input }) => {
    try {
      const job = toDetailedJob(input as z.infer<z.ZodObject<typeof jobFieldsShape>>);
      return textResult(await client.updateJob(jobId, job));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "delete_job",
  {
    title: "Delete a cron job",
    description: "Permanently delete a cron job by ID.",
    inputSchema: { jobId: z.number().int().describe("The job's numeric ID") },
  },
  async ({ jobId }) => {
    try {
      return textResult(await client.deleteJob(jobId));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "get_job_history",
  {
    title: "Get cron job execution history",
    description: "List recent executions of a cron job, plus predicted upcoming execution timestamps.",
    inputSchema: { jobId: z.number().int().describe("The job's numeric ID") },
  },
  async ({ jobId }) => {
    try {
      return textResult(await client.getJobHistory(jobId));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "get_history_item",
  {
    title: "Get a single execution's details",
    description: "Get full details (including response headers/body if saved) for one execution history entry.",
    inputSchema: {
      jobId: z.number().int().describe("The job's numeric ID"),
      identifier: z.string().describe("The history entry identifier, from get_job_history"),
    },
  },
  async ({ jobId, identifier }) => {
    try {
      return textResult(await client.getHistoryItem(jobId, identifier));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "list_folders",
  {
    title: "List folders",
    description: "List all folders used to organize cron jobs.",
    inputSchema: {},
  },
  async () => {
    try {
      return textResult(await client.listFolders());
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "get_folder",
  {
    title: "Get folder details",
    description: "Get details for one folder by ID.",
    inputSchema: { folderId: z.number().int().describe("The folder's numeric ID") },
  },
  async ({ folderId }) => {
    try {
      return textResult(await client.getFolder(folderId));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "create_folder",
  {
    title: "Create a folder",
    description: "Create a new folder to organize cron jobs into. Title must be unique, max 128 characters.",
    inputSchema: { title: z.string().max(128).describe("Folder title, must be unique in the account") },
  },
  async ({ title }) => {
    try {
      return textResult(await client.createFolder(title));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "update_folder",
  {
    title: "Rename a folder",
    description: "Rename an existing folder.",
    inputSchema: {
      folderId: z.number().int().describe("The folder's numeric ID"),
      title: z.string().max(128).describe("New folder title, must be unique in the account"),
    },
  },
  async ({ folderId, title }) => {
    try {
      return textResult(await client.updateFolder(folderId, title));
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.registerTool(
  "delete_folder",
  {
    title: "Delete a folder",
    description: "Delete a folder. Jobs inside it are not deleted; they become unfoldered.",
    inputSchema: { folderId: z.number().int().describe("The folder's numeric ID") },
  },
  async ({ folderId }) => {
    try {
      return textResult(await client.deleteFolder(folderId));
    } catch (err) {
      return errorResult(err);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("cron-job.org MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
