const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    const response = await this.request<{
      uploads: Array<{
        id: string;
        file_name: string;
        google_drive_file_id: string;
        upload_date: string;
        file_size: number;
      }>;
      total: number;
    }>(`/user/uploads?limit=${limit}&offset=${offset}`);
    return response;
  }

  // Stats endpoints
  async getUsageStats(days = 7) {
    const response = await this.request<{
      totalUploads: number;
      totalSize: number;
      uploadsByDay: Array<{
        date: string;
        count: number;
        size: number;
      }>;
    }>(`/stats/usage?days=${days}`);
    return response;
  }

  async getQuota() {
    const response = await this.request<{
      usage: number;
      limit: number;
      usageInDrive: number;
      usageInDriveTrash: number;
    }>('/stats/quota');
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