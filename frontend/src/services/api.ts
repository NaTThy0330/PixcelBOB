const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pixcelbob.onrender.com';
console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', import.meta.env.MODE);
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Auth endpoints
  async getGoogleAuthUrl(lineUserId?: string) {
    const params = lineUserId ? `?line_user_id=${lineUserId}` : '';
    const response = await this.request<{ authUrl: string }>(`/auth/google${params}`);
    return response;
  }

  async verifyToken() {
    const response = await this.request<{ 
      valid: boolean; 
      user?: { 
        email: string; 
        name: string; 
        google_drive_folder_id?: string;
        line_user_id?: string;
      } 
    }>('/auth/verify');
    return response;
  }

  // User endpoints
  async bindLine(lineUserId: string) {
    const response = await this.request('/user/bind', {
      method: 'POST',
      body: JSON.stringify({ lineUserId }),
    });
    return response;
  }

  async unbindLine() {
    const response = await this.request('/user/unbind', {
      method: 'POST',
    });
    return response;
  }

  async getBindingStatus() {
    const response = await this.request<{
      hasLineAccount: boolean;
      user: {
        email: string;
        name: string;
        line_user_id?: string;
        google_drive_folder_id?: string;
      };
    }>('/user/binding-status');
    return response;
  }

  async setFolder(folderId: string) {
    const response = await this.request('/user/folder', {
      method: 'POST',
      body: JSON.stringify({ folderId }),
    });
    return response;
  }

  async getFolders() {
    const response = await this.request<{
      folders: Array<{
        id: string;
        name: string;
        mimeType: string;
      }>;
    }>('/user/folders');
    return response;
  }

  async getUploads(limit = 20, offset = 0) {
    const response = await this.request<any>(`/user/uploads?limit=${limit}&offset=${offset}`);
    if (response.data && Array.isArray(response.data.uploads)) {
      const mapped = response.data.uploads.map((u: any) => ({
        id: u.id,
        file_name: u.google_file_name || u.file_name || '',
        google_drive_file_id: u.google_file_id || u.google_drive_file_id || '',
        upload_date: u.created_at || u.upload_date || '',
        file_size: typeof u.file_size === 'number' ? u.file_size : parseInt(u.file_size || '0', 10),
      }));
      return { data: { uploads: mapped, total: response.data.pagination?.total ?? mapped.length } };
    }
    return response;
  }

  // Stats endpoints
  async getUsageStats(days = 7) {
    const response = await this.request<any>(`/stats/usage?days=${days}`);
    if (response.data) {
      // Backend returns { summary: { totalUploads, totalSize, ... }, daily: [{ upload_date, count, size }] }
      const summary = response.data.summary || {};
      const daily = Array.isArray(response.data.daily) ? response.data.daily : [];
      const shaped = {
        totalUploads: Number(summary.totalUploads) || 0,
        totalSize: Number(summary.totalSize) || 0,
        uploadsByDay: daily.map((d: any) => ({
          date: d.upload_date || d.date || '',
          count: Number(d.count) || 0,
          size: Number(d.size) || 0,
        })),
      };
      return { data: shaped };
    }
    return response;
  }

  async getQuota() {
    const response = await this.request<any>('/stats/quota');
    if (response.data && response.data.quota) {
      const q = response.data.quota;
      // Normalize to { usage, limit, usageInDrive, usageInDriveTrash }
      const shaped = {
        usage: Number(q.usedQuota) || 0,
        limit: Number(q.totalQuota) || 0,
        usageInDrive: Number(q.usedQuota) || 0, // not provided explicitly; mirror usage
        usageInDriveTrash: 0,
        packageName: q.package || undefined,
        price: typeof q.price === 'number' ? q.price : (q.price ? Number(q.price) : undefined),
      };
      return { data: shaped };
    }
    return response;
  }

  async getActivity() {
    const response = await this.request<{
      activities: Array<{
        id: string;
        type: string;
        description: string;
        timestamp: string;
        metadata?: any;
      }>;
    }>('/stats/activity');
    return response;
  }

  async getPackages() {
    return fetch('/api/packages').then(res => res.json());
  }
}

export const apiService = new ApiService();
