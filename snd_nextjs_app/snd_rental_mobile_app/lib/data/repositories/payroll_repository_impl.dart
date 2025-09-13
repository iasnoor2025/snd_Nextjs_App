import '../models/payroll_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class PayrollRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<List<PayrollModel>> getPayrolls({
    int page = 1,
    int limit = 20,
    String? status,
    int? employeeId,
    String? period,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (status != null) queryParams['status'] = status;
      if (employeeId != null) queryParams['employee_id'] = employeeId;
      if (period != null) queryParams['period'] = period;

      final response = await _apiClient.get('/payrolls', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => PayrollModel.fromJson(item))
              .toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch payrolls: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<PayrollModel?> getPayrollById(int id) async {
    try {
      final response = await _apiClient.get('/payrolls/$id');
      
      if (response.statusCode == 200) {
        return PayrollModel.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch payroll: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<PayrollModel> createPayroll(PayrollModel payroll) async {
    try {
      final response = await _apiClient.post('/payrolls', data: payroll.toJson());
      
      if (response.statusCode == 201) {
        return PayrollModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to create payroll',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to create payroll: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<PayrollModel> updatePayroll(int id, PayrollModel payroll) async {
    try {
      final response = await _apiClient.put('/payrolls/$id', data: payroll.toJson());
      
      if (response.statusCode == 200) {
        return PayrollModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to update payroll',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to update payroll: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> deletePayroll(int id) async {
    try {
      final response = await _apiClient.delete('/payrolls/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete payroll',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      throw ApiException(
        message: 'Failed to delete payroll: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<PayrollModel> approvePayroll(int id) async {
    try {
      final response = await _apiClient.post('/payrolls/$id/approve');
      
      if (response.statusCode == 200) {
        return PayrollModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to approve payroll',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to approve payroll: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<PayrollModel> processPayroll(int id) async {
    try {
      final response = await _apiClient.post('/payrolls/$id/process');
      
      if (response.statusCode == 200) {
        return PayrollModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to process payroll',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to process payroll: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<String> generatePayslip(int id) async {
    try {
      final response = await _apiClient.get('/payrolls/$id/payslip');
      
      if (response.statusCode == 200) {
        return response.data['file_url'] ?? '';
      }
      
      throw ApiException(
        message: 'Failed to generate payslip',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to generate payslip: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
