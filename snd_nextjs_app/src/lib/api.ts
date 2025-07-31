// Basic API service for making HTTP requests
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Project Resources Methods
  async getProjectResources(projectId: string) {
    return this.get(`/projects/${projectId}/resources`);
  }

  async createProjectResource(projectId: string, data: any) {
    return this.post(`/projects/${projectId}/resources`, data);
  }

  async updateProjectResource(projectId: string, resourceId: string, data: any) {
    return this.put(`/projects/${projectId}/resources/${resourceId}`, data);
  }

  async deleteProjectResource(projectId: string, resourceId: string) {
    return this.delete(`/projects/${projectId}/resources/${resourceId}`);
  }

  // Equipment Methods
  async getEquipment() {
    return this.get('/equipment');
  }

  // Employee Methods
  async getEmployees() {
    return this.get('/employees');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 