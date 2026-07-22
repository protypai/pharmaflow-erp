export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  tableName: string;
  operation: SyncOperation;
  payload: Record<string, any>;
  appVersion: string;
  deviceId: string;
  createdAt: string;
}

export interface SyncPushPayload {
  items: SyncQueueItem[];
}

export interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}
