export interface JobSchedule {
  timezone?: string;
  expiresAt?: number;
  hours?: number[];
  mdays?: number[];
  minutes?: number[];
  months?: number[];
  wdays?: number[];
}

export interface JobAuth {
  enable?: boolean;
  user?: string;
  password?: string;
}

export interface JobNotificationSettings {
  onFailure?: boolean;
  onFailureCount?: number;
  onSuccess?: boolean;
  onDisable?: boolean;
  onSslCertExpiry?: boolean;
  onSslCertExpirySeconds?: number;
}

export interface JobExtendedData {
  headers?: Record<string, string>;
  body?: string;
}

// 0=GET 1=POST 2=OPTIONS 3=HEAD 4=PUT 5=DELETE 6=TRACE 7=CONNECT 8=PATCH
export type RequestMethod = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// 0=default job, 1=monitoring job
export type JobType = 0 | 1;

export interface Job {
  jobId?: number;
  enabled?: boolean;
  title?: string;
  saveResponses?: boolean;
  url: string;
  lastStatus?: number;
  lastDuration?: number;
  lastExecution?: number;
  sslCertExpiry?: number;
  nextExecution?: number;
  type?: JobType;
  requestTimeout?: number;
  redirectSuccess?: boolean;
  folderId?: number;
  schedule?: JobSchedule;
  requestMethod?: RequestMethod;
}

export interface DetailedJob extends Job {
  auth?: JobAuth;
  notification?: JobNotificationSettings;
  extendedData?: JobExtendedData;
}

export interface HistoryItemStats {
  nameLookup?: number;
  connect?: number;
  appConnect?: number;
  preTransfer?: number;
  startTransfer?: number;
  total?: number;
}

export interface HistoryItem {
  jobId: number;
  identifier: string;
  date: number;
  datePlanned: number;
  jitter: number;
  url: string;
  duration: number;
  status: number;
  statusText: string;
  httpStatus: number;
  headers?: string | null;
  body?: string | null;
  stats?: HistoryItemStats;
  sslCertExpiry?: number;
}

export interface Folder {
  folderId?: number;
  title: string;
}
