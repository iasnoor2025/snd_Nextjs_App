// Basic API service for making HTTP requests
class ApiService {
  private baseUrl: string;

  constructor() {
    // For Next.js API routes, use the same domain
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
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
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`;
        }
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      
      throw new Error(errorMessage);
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
  async getEmployees(params?: { per_page?: number; page?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/employees?${queryString}` : '/employees';
    return this.get(endpoint);
  }

  // Project Methods
  async getProjects(params?: { page?: number; limit?: number; search?: string; status?: string; priority?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/projects?${queryString}` : '/projects';
    return this.get(endpoint);
  }

  async createProject(data: any) {
    return this.post('/projects', data);
  }

  async updateProject(id: string, data: any) {
    return this.put(`/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.delete(`/projects/${id}`);
  }

  async getProject(id: string) {
    return this.get(`/projects/${id}`);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService; 