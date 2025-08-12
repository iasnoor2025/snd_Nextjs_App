import ApiService from '../api-service';

export interface SalaryIncrement {
  id: number;
  employee_id: number;
  current_base_salary: number;
  current_food_allowance: number;
  current_housing_allowance: number;
  current_transport_allowance: number;
  new_base_salary: number;
  new_food_allowance: number;
  new_housing_allowance: number;
  new_transport_allowance: number;
  increment_type: string;
  increment_percentage?: number;
  increment_amount?: number;
  reason: string;
  effective_date: string;
  requested_by: number;
  requested_at: string;
  approved_by?: number;
  approved_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  rejection_reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  requested_by_user?: {
    id: number;
    name: string;
  };
  approved_by_user?: {
    id: number;
    name: string;
  };
  rejected_by_user?: {
    id: number;
    name: string;
  };
}

export interface CreateSalaryIncrementData {
  employee_id: number;
  increment_type: 'percentage' | 'amount' | 'promotion' | 'annual_review' | 'performance' | 'market_adjustment';
  increment_percentage?: number;
  increment_amount?: number;
  reason: string;
  effective_date: string;
  notes?: string;
  new_base_salary?: number;
  new_food_allowance?: number;
  new_housing_allowance?: number;
  new_transport_allowance?: number;
  apply_to_allowances?: boolean;
}

export type UpdateSalaryIncrementData = Partial<CreateSalaryIncrementData>;

export interface SalaryIncrementFilters {
  employee_id?: number;
  status?: string;
  increment_type?: string;
  effective_date_from?: string;
  effective_date_to?: string;
  page?: number;
  limit?: number;
}

export interface SalaryIncrementResponse {
  data: SalaryIncrement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SalaryIncrementStatistics {
  total_increments: number;
  pending_increments: number;
  approved_increments: number;
  rejected_increments: number;
  applied_increments: number;
  total_increment_amount: number;
  average_increment_percentage: number;
  by_type: Record<string, { count: number; avg_percentage: number }>;
}

class SalaryIncrementService {
  async getSalaryIncrements(filters: SalaryIncrementFilters = {}): Promise<SalaryIncrementResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await ApiService.get(`/salary-increments?${params.toString()}`);
    
    // The API returns { data: [...], pagination: {...} } directly
    // but ApiService.get returns ApiResponse<T> which expects { success: boolean, data: T }
    // So we need to handle the actual response structure
    const apiResponse = response as any; // Cast to any to handle the actual response structure
    
    return {
      data: apiResponse.data || [],
      pagination: apiResponse.pagination ? {
        page: apiResponse.pagination.page || 1,
        limit: apiResponse.pagination.limit || 15,
        total: apiResponse.pagination.total || 0,
        pages: apiResponse.pagination.pages || 0
      } : { page: 1, limit: 15, total: 0, pages: 0 }
    };
  }

  async getSalaryIncrement(id: number): Promise<SalaryIncrement> {
    const response = await ApiService.get(`/salary-increments/${id}`);
    return response.data;
  }

  async createSalaryIncrement(data: CreateSalaryIncrementData): Promise<SalaryIncrement> {
    const response = await ApiService.post('/salary-increments', data);
    return response.data;
  }

  async updateSalaryIncrement(id: number, data: UpdateSalaryIncrementData): Promise<SalaryIncrement> {
    const response = await ApiService.put(`/salary-increments/${id}`, data);
    return response.data;
  }

  async deleteSalaryIncrement(id: number): Promise<void> {
    await ApiService.delete(`/salary-increments/${id}`);
  }

  async approveSalaryIncrement(id: number, notes?: string): Promise<SalaryIncrement> {
    const response = await ApiService.post(`/salary-increments/${id}/approve`, { notes });
    return response.data;
  }

  async rejectSalaryIncrement(id: number, rejection_reason: string, notes?: string): Promise<SalaryIncrement> {
    const response = await ApiService.post(`/salary-increments/${id}/reject`, { notes, rejection_reason });
    return response.data;
  }

  async applySalaryIncrement(id: number): Promise<SalaryIncrement> {
    const response = await ApiService.post(`/salary-increments/${id}/apply`);
    return response.data;
  }

  async getStatistics(filters: { from_date?: string; to_date?: string } = {}): Promise<SalaryIncrementStatistics> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });

    const response = await ApiService.get(`/salary-increments/statistics?${params.toString()}`);
    return response.data;
  }

  async getEmployeeSalaryHistory(employeeId: number): Promise<SalaryIncrement[]> {
    const response = await ApiService.get(`/employees/${employeeId}/salary-increments`);
    return response.data;
  }

  // Helper methods for calculated values
  getCurrentTotalSalary(increment: SalaryIncrement): number {
    return parseFloat(String(increment.current_base_salary || 0)) + 
           parseFloat(String(increment.current_food_allowance || 0)) + 
           parseFloat(String(increment.current_housing_allowance || 0)) + 
           parseFloat(String(increment.current_transport_allowance || 0));
  }

  getNewTotalSalary(increment: SalaryIncrement): number {
    return parseFloat(String(increment.new_base_salary || 0)) + 
           parseFloat(String(increment.new_food_allowance || 0)) + 
           parseFloat(String(increment.new_housing_allowance || 0)) + 
           parseFloat(String(increment.new_transport_allowance || 0));
  }

  getTotalIncrementAmount(increment: SalaryIncrement): number {
    return this.getNewTotalSalary(increment) - this.getCurrentTotalSalary(increment);
  }

  getActualIncrementPercentage(increment: SalaryIncrement): number {
    const currentTotal = this.getCurrentTotalSalary(increment);
    if (currentTotal === 0) return 0;
    
    return ((this.getNewTotalSalary(increment) - currentTotal) / currentTotal) * 100;
  }

  getIncrementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      percentage: 'Percentage Increase',
      amount: 'Fixed Amount Increase',
      promotion: 'Promotion',
      annual_review: 'Annual Review',
      performance: 'Performance',
      market_adjustment: 'Market Adjustment',
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      applied: 'Applied',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      applied: 'blue',
    };
    return colors[status] || 'gray';
  }
}

export const salaryIncrementService = new SalaryIncrementService();
