import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';
import '../../domain/repositories/employee_repository.dart';
import '../models/employee_model.dart';

class EmployeeRepositoryImpl implements EmployeeRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<EmployeeModel>> getEmployees({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? department,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }
      if (department != null && department.isNotEmpty) {
        queryParams['department'] = department;
      }

      final response = await _apiClient.get('/employees', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => EmployeeModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch employees',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<EmployeeModel?> getEmployeeById(String id) async {
    try {
      final response = await _apiClient.get('/employees/$id');
      
      if (response.statusCode == 200) {
        return EmployeeModel.fromJson(response.data);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw ApiException(
          message: 'Failed to fetch employee',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<EmployeeModel> createEmployee(EmployeeModel employee) async {
    try {
      final response = await _apiClient.post('/employees', data: employee.toJson());
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return EmployeeModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to create employee',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<EmployeeModel> updateEmployee(String id, EmployeeModel employee) async {
    try {
      final response = await _apiClient.put('/employees/$id', data: employee.toJson());
      
      if (response.statusCode == 200) {
        return EmployeeModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to update employee',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<void> deleteEmployee(String id) async {
    try {
      final response = await _apiClient.delete('/employees/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete employee',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getEmployeeDocuments(String employeeId) async {
    try {
      final response = await _apiClient.get('/employees/$employeeId/documents');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch employee documents',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<Map<String, dynamic>> uploadEmployeeDocument(
    String employeeId,
    String filePath,
    String documentType,
  ) async {
    try {
      final response = await _apiClient.uploadFile(
        '/employees/$employeeId/documents',
        filePath,
        data: {'documentType': documentType},
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to upload document',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getEmployeeSkills(String employeeId) async {
    try {
      final response = await _apiClient.get('/employees/$employeeId/skills');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch employee skills',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<void> addEmployeeSkill(
    String employeeId,
    String skillId,
    String proficiencyLevel,
  ) async {
    try {
      final response = await _apiClient.post(
        '/employees/$employeeId/skills',
        data: {
          'skillId': skillId,
          'proficiencyLevel': proficiencyLevel,
        },
      );
      
      if (response.statusCode != 201 && response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to add skill',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getEmployeeTraining(String employeeId) async {
    try {
      final response = await _apiClient.get('/employees/$employeeId/training');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch employee training',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<Map<String, dynamic>>> getEmployeePerformanceReviews(String employeeId) async {
    try {
      final response = await _apiClient.get('/employees/$employeeId/performance-reviews');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch performance reviews',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<EmployeeModel>> searchEmployees(String query) async {
    try {
      final response = await _apiClient.get('/employees/search', queryParameters: {'q': query});
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => EmployeeModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to search employees',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<List<EmployeeModel>> getEmployeesByDepartment(String department) async {
    return getEmployees(department: department);
  }

  @override
  Future<List<EmployeeModel>> getActiveEmployees() async {
    return getEmployees(status: 'active');
  }
}
