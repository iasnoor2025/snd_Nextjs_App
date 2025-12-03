import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';
import '../../domain/repositories/timesheet_repository.dart';
import '../models/timesheet_model.dart';

class TimesheetRepositoryImpl implements TimesheetRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<TimesheetModel>> getTimesheets({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? employeeId,
    String? projectId,
    DateTime? startDate,
    DateTime? endDate,
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
      if (employeeId != null && employeeId.isNotEmpty) {
        queryParams['employeeId'] = employeeId;
      }
      if (projectId != null && projectId.isNotEmpty) {
        queryParams['projectId'] = projectId;
      }
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final response = await _apiClient.get('/timesheets', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => TimesheetModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch timesheets',
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
  Future<TimesheetModel?> getTimesheetById(String id) async {
    try {
      final response = await _apiClient.get('/timesheets/$id');
      
      if (response.statusCode == 200) {
        return TimesheetModel.fromJson(response.data);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw ApiException(
          message: 'Failed to fetch timesheet',
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
  Future<TimesheetModel> createTimesheet(TimesheetModel timesheet) async {
    try {
      final response = await _apiClient.post('/timesheets', data: timesheet.toJson());
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return TimesheetModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to create timesheet',
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
  Future<TimesheetModel> updateTimesheet(String id, TimesheetModel timesheet) async {
    try {
      final response = await _apiClient.put('/timesheets/$id', data: timesheet.toJson());
      
      if (response.statusCode == 200) {
        return TimesheetModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to update timesheet',
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
  Future<void> deleteTimesheet(String id) async {
    try {
      final response = await _apiClient.delete('/timesheets/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete timesheet',
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
  Future<List<TimesheetModel>> getEmployeeTimesheets(
    String employeeId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final response = await _apiClient.get(
        '/timesheets/employee/$employeeId',
        queryParameters: queryParams,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => TimesheetModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch employee timesheets',
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
  Future<List<TimesheetModel>> getProjectTimesheets(
    String projectId, {
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }

      final response = await _apiClient.get(
        '/timesheets/project/$projectId',
        queryParameters: queryParams,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => TimesheetModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch project timesheets',
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
  Future<List<TimesheetModel>> getWeeklyTimesheets({
    DateTime? weekStart,
    String? employeeId,
    String? projectId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      
      if (weekStart != null) {
        queryParams['weekStart'] = weekStart.toIso8601String();
      }
      if (employeeId != null && employeeId.isNotEmpty) {
        queryParams['employeeId'] = employeeId;
      }
      if (projectId != null && projectId.isNotEmpty) {
        queryParams['projectId'] = projectId;
      }

      final response = await _apiClient.get('/timesheets/weekly', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => TimesheetModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch weekly timesheets',
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
  Future<List<TimesheetModel>> getMonthlyTimesheets({
    int? year,
    int? month,
    String? employeeId,
    String? projectId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      
      if (year != null) {
        queryParams['year'] = year;
      }
      if (month != null) {
        queryParams['month'] = month;
      }
      if (employeeId != null && employeeId.isNotEmpty) {
        queryParams['employeeId'] = employeeId;
      }
      if (projectId != null && projectId.isNotEmpty) {
        queryParams['projectId'] = projectId;
      }

      final response = await _apiClient.get('/timesheets/monthly', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => TimesheetModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch monthly timesheets',
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
  Future<void> approveTimesheet(String id, String approvedById) async {
    try {
      final response = await _apiClient.post(
        '/timesheets/$id/approve',
        data: {'approvedById': approvedById},
      );
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to approve timesheet',
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
  Future<void> rejectTimesheet(String id, String rejectionReason) async {
    try {
      final response = await _apiClient.post(
        '/timesheets/$id/reject',
        data: {'rejectionReason': rejectionReason},
      );
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to reject timesheet',
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
  Future<void> bulkApproveTimesheets(List<String> timesheetIds, String approvedById) async {
    try {
      final response = await _apiClient.post(
        '/timesheets/bulk-approve',
        data: {
          'timesheetIds': timesheetIds,
          'approvedById': approvedById,
        },
      );
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to bulk approve timesheets',
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
  Future<List<TimesheetModel>> getPendingApprovals() async {
    try {
      final response = await _apiClient.get('/timesheets/pending-approvals');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => TimesheetModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch pending approvals',
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
  Future<Map<String, dynamic>> getTimesheetStatistics({
    DateTime? startDate,
    DateTime? endDate,
    String? employeeId,
    String? projectId,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      
      if (startDate != null) {
        queryParams['startDate'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['endDate'] = endDate.toIso8601String();
      }
      if (employeeId != null && employeeId.isNotEmpty) {
        queryParams['employeeId'] = employeeId;
      }
      if (projectId != null && projectId.isNotEmpty) {
        queryParams['projectId'] = projectId;
      }

      final response = await _apiClient.get('/timesheets/statistics', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to fetch timesheet statistics',
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
  Future<List<TimesheetModel>> searchTimesheets(String query) async {
    try {
      final response = await _apiClient.get('/timesheets/search', queryParameters: {'q': query});
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => TimesheetModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to search timesheets',
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
  Future<List<TimesheetModel>> getTimesheetsByStatus(String status) async {
    return getTimesheets(status: status);
  }

  @override
  Future<List<TimesheetModel>> getTimesheetsByDateRange(
    DateTime startDate,
    DateTime endDate,
  ) async {
    return getTimesheets(startDate: startDate, endDate: endDate);
  }
}
