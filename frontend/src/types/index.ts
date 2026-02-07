export interface User {
  email: string;
  name: string;
  googleConnected: boolean;
  lineConnected: boolean;
  selectedFolder?: string;
  selectedFolderId?: string;
  token?: string;
}

export interface Folder {
  id: string;
  name: string;
  mimeType: string;
}

export interface Upload {
  id: string;
  file_name: string;
  google_drive_file_id: string;
  upload_date: string;
  file_size: number;
}

export interface UsageStats {
  totalUploads: number;
  totalSize: number;
  uploadsByDay: Array<{
    date: string;
    count: number;
    size: number;
  }>;
}

export interface Quota {
  usage: number;
  limit: number;
  usageInDrive: number;
  usageInDriveTrash: number;
  packageName?: string;
  price?: number;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface Package {
  id: number;
  name: string;
  upload_limit: number;
  price: number;
  is_active: boolean;
  is_editable: boolean;
  popular?: boolean; // Optional, for UI
}
