import { ToastService } from './toast-service';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  showToast?: boolean;
  toastMessage?: string;
  errorMessage?: string;
}

export class ApiService {
  private static baseUrl = '/api';

  // ========================================
  // CORE API METHODS
  // ========================================

  static async request<T = any>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      params,
      showToast = true,
      toastMessage,
      errorMessage,
    } = options;

    try {
      // Build URL with query parameters
      let url = `${this.baseUrl}${endpoint}`;
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      // Make request
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      // Show success toast if requested
      if (showToast && toastMessage) {
        ToastService.success(toastMessage);
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      
      if (showToast) {
        ToastService.error(errorMessage || message);
      }
      
      throw error;
    }
  }

  // ========================================
  // CRUD OPERATIONS
  // ========================================

  static async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options?: Omit<ApiOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
      ...options,
    });
  }

  static async post<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      ...options,
    });
  }

  static async put<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      ...options,
    });
  }

  static async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body,
      ...options,
    });
  }

  static async delete<T = any>(
    endpoint: string,
    options?: Omit<ApiOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // ========================================
  // EMPLOYEE MANAGEMENT
  // ========================================

  static async getEmployees(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    department?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return this.get('/employees', params, {
      toastMessage: 'Employees loaded successfully',
      errorMessage: 'Failed to load employees',
    });
  }

  static async getEmployee(id: number) {
    return this.get(`/employees/${id}`, undefined, {
      errorMessage: 'Failed to load employee',
    });
  }

  static async createEmployee(data: any) {
    return this.post('/employees', data, {
      toastMessage: 'Employee created successfully',
      errorMessage: 'Failed to create employee',
    });
  }

  static async updateEmployee(id: number, data: any) {
    return this.put(`/employees/${id}`, data, {
      toastMessage: 'Employee updated successfully',
      errorMessage: 'Failed to update employee',
    });
  }

  static async deleteEmployee(id: number) {
    return this.delete(`/employees/${id}`, {
      toastMessage: 'Employee deleted successfully',
      errorMessage: 'Failed to delete employee',
    });
  }

  static async syncEmployees() {
    return this.post('/employees/sync', undefined, {
      toastMessage: 'Employees synced successfully',
      errorMessage: 'Failed to sync employees',
    });
  }

  // ========================================
  // CUSTOMER MANAGEMENT
  // ========================================

  static async getCustomers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return this.get('/customers', params, {
      toastMessage: 'Customers loaded successfully',
      errorMessage: 'Failed to load customers',
    });
  }

  static async getCustomer(id: number) {
    return this.get(`/customers/${id}`, undefined, {
      errorMessage: 'Failed to load customer',
    });
  }

  static async createCustomer(data: any) {
    return this.post('/customers', data, {
      toastMessage: 'Customer created successfully',
      errorMessage: 'Failed to create customer',
    });
  }

  static async updateCustomer(id: number, data: any) {
    return this.put(`/customers/${id}`, data, {
      toastMessage: 'Customer updated successfully',
      errorMessage: 'Failed to update customer',
    });
  }

  static async deleteCustomer(id: number) {
    return this.delete(`/customers/${id}`, {
      toastMessage: 'Customer deleted successfully',
      errorMessage: 'Failed to delete customer',
    });
  }

  // ========================================
  // EQUIPMENT MANAGEMENT
  // ========================================

  static async getEquipment(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    category?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return this.get('/equipment', params, {
      toastMessage: 'Equipment loaded successfully',
      errorMessage: 'Failed to load equipment',
    });
  }

  static async getEquipmentItem(id: number) {
    return this.get(`/equipment/${id}`, undefined, {
      errorMessage: 'Failed to load equipment',
    });
  }

  static async createEquipment(data: any) {
    return this.post('/equipment', data, {
      toastMessage: 'Equipment created successfully',
      errorMessage: 'Failed to create equipment',
    });
  }

  static async updateEquipment(id: number, data: any) {
    return this.put(`/equipment/${id}`, data, {
      toastMessage: 'Equipment updated successfully',
      errorMessage: 'Failed to update equipment',
    });
  }

  static async deleteEquipment(id: number) {
    return this.delete(`/equipment/${id}`, {
      toastMessage: 'Equipment deleted successfully',
      errorMessage: 'Failed to delete equipment',
    });
  }

  static async getEquipmentRentalHistory(id: number) {
    return this.get(`/equipment/${id}/rentals`, undefined, {
      errorMessage: 'Failed to load equipment rental history',
    });
  }

  static async createEquipmentAssignment(id: number, data: {
    assignment_type: 'rental' | 'project' | 'manual';
    project_id?: number;
    employee_id?: number;
    rental_id?: number;
    start_date: string;
    end_date?: string;
    daily_rate?: number;
    total_amount?: number;
    notes?: string;
    status?: string;
  }) {
    return this.post(`/equipment/${id}/rentals`, data, {
      toastMessage: 'Equipment assignment created successfully',
      errorMessage: 'Failed to create equipment assignment',
    });
  }

  // ========================================
  // ERPNext EQUIPMENT INTEGRATION
  // ========================================

  static async getERPNextEquipment(params?: {
    sync_erpnext?: boolean;
    source?: 'erpnext' | 'local';
  }) {
    return this.get('/equipment', params, {
      toastMessage: 'Equipment loaded successfully',
      errorMessage: 'Failed to load equipment',
    });
  }

  static async syncEquipmentFromERPNext() {
    return this.post('/equipment/sync', {}, {
      toastMessage: 'Equipment synced from ERPNext successfully',
      errorMessage: 'Failed to sync equipment from ERPNext',
    });
  }

  static async getERPNextEquipmentDirect() {
    return this.get('/erpnext/equipment', undefined, {
      errorMessage: 'Failed to fetch equipment from ERPNext',
    });
  }

  // ========================================
  // RENTAL MANAGEMENT
  // ========================================

  static async getRentals(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    customer_id?: number;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return this.get('/rentals', params, {
      toastMessage: 'Rentals loaded successfully',
      errorMessage: 'Failed to load rentals',
    });
  }

  static async getRental(id: number) {
    return this.get(`/rentals/${id}`, undefined, {
      errorMessage: 'Failed to load rental',
    });
  }

  static async createRental(data: any) {
    return this.post('/rentals', data, {
      toastMessage: 'Rental created successfully',
      errorMessage: 'Failed to create rental',
    });
  }

  static async updateRental(id: number, data: any) {
    return this.put(`/rentals/${id}`, data, {
      toastMessage: 'Rental updated successfully',
      errorMessage: 'Failed to update rental',
    });
  }

  static async deleteRental(id: number) {
    return this.delete(`/rentals/${id}`, {
      toastMessage: 'Rental deleted successfully',
      errorMessage: 'Failed to delete rental',
    });
  }

  static async approveRental(id: number) {
    return this.post(`/rentals/${id}/approve`, undefined, {
      toastMessage: 'Rental approved successfully',
      errorMessage: 'Failed to approve rental',
    });
  }

  static async completeRental(id: number) {
    return this.post(`/rentals/${id}/complete`, undefined, {
      toastMessage: 'Rental completed successfully',
      errorMessage: 'Failed to complete rental',
    });
  }

  // ========================================
  // TIMESHEET MANAGEMENT
  // ========================================

  static async getTimesheets(params?: {
    page?: number;
    per_page?: number;
    employee_id?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return this.get('/timesheets', params, {
      toastMessage: 'Timesheets loaded successfully',
      errorMessage: 'Failed to load timesheets',
    });
  }

  static async getTimesheet(id: number) {
    return this.get(`/timesheets/${id}`, undefined, {
      errorMessage: 'Failed to load timesheet',
    });
  }

  static async createTimesheet(data: any) {
    return this.post('/timesheets', data, {
      toastMessage: 'Timesheet created successfully',
      errorMessage: 'Failed to create timesheet',
    });
  }

  static async updateTimesheet(id: number, data: any) {
    return this.put(`/timesheets/${id}`, data, {
      toastMessage: 'Timesheet updated successfully',
      errorMessage: 'Failed to update timesheet',
    });
  }

  static async approveTimesheet(id: number) {
    return this.post(`/timesheets/${id}/approve`, undefined, {
      toastMessage: 'Timesheet approved successfully',
      errorMessage: 'Failed to approve timesheet',
    });
  }

  static async rejectTimesheet(id: number, reason?: string) {
    return this.post(`/timesheets/${id}/reject`, { reason }, {
      toastMessage: 'Timesheet rejected successfully',
      errorMessage: 'Failed to reject timesheet',
    });
  }

  // ========================================
  // PAYROLL MANAGEMENT
  // ========================================

  static async getPayrolls(params?: {
    page?: number;
    per_page?: number;
    employee_id?: number;
    month?: number;
    year?: number;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return this.get('/payrolls', params, {
      toastMessage: 'Payrolls loaded successfully',
      errorMessage: 'Failed to load payrolls',
    });
  }

  static async getPayroll(id: number) {
    return this.get(`/payrolls/${id}`, undefined, {
      errorMessage: 'Failed to load payroll',
    });
  }

  static async createPayroll(data: any) {
    return this.post('/payrolls', data, {
      toastMessage: 'Payroll created successfully',
      errorMessage: 'Failed to create payroll',
    });
  }

  static async approvePayroll(id: number) {
    return this.post(`/payrolls/${id}/approve`, undefined, {
      toastMessage: 'Payroll approved successfully',
      errorMessage: 'Failed to approve payroll',
    });
  }

  static async processPayroll(id: number) {
    return this.post(`/payrolls/${id}/process`, undefined, {
      toastMessage: 'Payroll processed successfully',
      errorMessage: 'Failed to process payroll',
    });
  }

  // ========================================
  // PROJECT MANAGEMENT
  // ========================================

  static async getProjects(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    customer_id?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    return this.get('/projects', params, {
      toastMessage: 'Projects loaded successfully',
      errorMessage: 'Failed to load projects',
    });
  }

  static async getProject(id: number) {
    return this.get(`/projects/${id}`, undefined, {
      errorMessage: 'Failed to load project',
    });
  }

  static async createProject(data: any) {
    return this.post('/projects', data, {
      toastMessage: 'Project created successfully',
      errorMessage: 'Failed to create project',
    });
  }

  static async updateProject(id: number, data: any) {
    return this.put(`/projects/${id}`, data, {
      toastMessage: 'Project updated successfully',
      errorMessage: 'Failed to update project',
    });
  }

  static async deleteProject(id: number) {
    return this.delete(`/projects/${id}`, {
      toastMessage: 'Project deleted successfully',
      errorMessage: 'Failed to delete project',
    });
  }

  // ========================================
  // PROJECT RESOURCES METHODS
  // ========================================

  static async getProjectResources(projectId: number) {
    return this.get(`/projects/${projectId}/resources`);
  }

  static async createProjectResource(projectId: number, data: any) {
    return this.post(`/projects/${projectId}/resources`, data, {
      showToast: true,
      toastMessage: 'Resource added successfully',
      errorMessage: 'Failed to add resource'
    });
  }

  static async updateProjectResource(projectId: number, resourceId: number, data: any) {
    return this.put(`/projects/${projectId}/resources/${resourceId}`, data, {
      showToast: true,
      toastMessage: 'Resource updated successfully',
      errorMessage: 'Failed to update resource'
    });
  }

  static async deleteProjectResource(projectId: number, resourceId: number) {
    return this.delete(`/projects/${projectId}/resources/${resourceId}`, {
      showToast: true,
      toastMessage: 'Resource deleted successfully',
      errorMessage: 'Failed to delete resource'
    });
  }

  // ========================================
  // FILE UPLOAD
  // ========================================

  static async uploadFile(
    file: File,
    endpoint: string,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      ToastService.fileUploadSuccess(file.name);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      ToastService.fileUploadError(file.name, message);
      throw error;
    }
  }

  static async uploadEmployeeDocument(
    employeeId: number,
    file: File,
    documentType: string
  ) {
    return this.uploadFile(file, '/employees/documents', {
      employee_id: employeeId,
      document_type: documentType,
    });
  }

  static async uploadEquipmentImage(equipmentId: number, file: File) {
    return this.uploadFile(file, '/equipment/images', {
      equipment_id: equipmentId,
    });
  }

  // ========================================
  // EXPORT OPERATIONS
  // ========================================

  static async exportData(
    endpoint: string,
    format: 'pdf' | 'excel' | 'csv' = 'pdf',
    params?: Record<string, any>
  ): Promise<Blob> {
    try {
      const searchParams = new URLSearchParams({
        format,
        ...params,
      });

      const response = await fetch(`${this.baseUrl}${endpoint}?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      ToastService.exportSuccess(format.toUpperCase());
      return blob;
    } catch (error) {
      ToastService.exportError(format.toUpperCase(), 'Export failed');
      throw error;
    }
  }

  static async exportEmployees(format: 'pdf' | 'excel' | 'csv' = 'pdf') {
    return this.exportData('/employees/export', format);
  }

  static async exportRentals(format: 'pdf' | 'excel' | 'csv' = 'pdf') {
    return this.exportData('/rentals/export', format);
  }

  static async exportTimesheets(format: 'pdf' | 'excel' | 'csv' = 'pdf') {
    return this.exportData('/timesheets/export', format);
  }

  static async exportPayrolls(format: 'pdf' | 'excel' | 'csv' = 'pdf') {
    return this.exportData('/payrolls/export', format);
  }

  // ========================================
  // REPORTING
  // ========================================

  static async getDashboardStats() {
    return this.get('/dashboard/stats', undefined, {
      errorMessage: 'Failed to load dashboard stats',
    });
  }

  static async getRentalAnalytics(params?: {
    start_date?: string;
    end_date?: string;
    group_by?: 'day' | 'week' | 'month';
  }) {
    return this.get('/analytics/rentals', params, {
      errorMessage: 'Failed to load rental analytics',
    });
  }

  static async getEquipmentUtilization(params?: {
    start_date?: string;
    end_date?: string;
    equipment_id?: number;
  }) {
    return this.get('/analytics/equipment-utilization', params, {
      errorMessage: 'Failed to load equipment utilization',
    });
  }

  static async getFinancialReport(params?: {
    start_date?: string;
    end_date?: string;
    report_type?: 'revenue' | 'expenses' | 'profit';
  }) {
    return this.get('/reports/financial', params, {
      errorMessage: 'Failed to load financial report',
    });
  }

  // ========================================
  // SETTINGS
  // ========================================

  static async getSettings() {
    return this.get('/settings', undefined, {
      errorMessage: 'Failed to load settings',
    });
  }

  static async updateSettings(data: any) {
    return this.put('/settings', data, {
      toastMessage: 'Settings updated successfully',
      errorMessage: 'Failed to update settings',
    });
  }

  // ========================================
  // NOTIFICATIONS
  // ========================================

  static async getNotifications(params?: {
    page?: number;
    per_page?: number;
    unread_only?: boolean;
  }) {
    return this.get('/notifications', params, {
      errorMessage: 'Failed to load notifications',
    });
  }

  static async markNotificationAsRead(id: string) {
    return this.post(`/notifications/${id}/read`, undefined, {
      errorMessage: 'Failed to mark notification as read',
    });
  }

  static async markAllNotificationsAsRead() {
    return this.post('/notifications/mark-all-read', undefined, {
      toastMessage: 'All notifications marked as read',
      errorMessage: 'Failed to mark notifications as read',
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  static downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static async testConnection() {
    try {
      const response = await this.get('/health');
      ToastService.connectionSuccess('API');
      return response;
    } catch (error) {
      ToastService.connectionError('API', 'Connection test failed');
      throw error;
    }
  }
}

export default ApiService; 