import '../models/leave_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class LeaveRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<List<LeaveModel>> getLeaves({
    int page = 1,
    int limit = 20,
    String? status,
    int? employeeId,
    String? leaveType,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (status != null) queryParams['status'] = status;
      if (employeeId != null) queryParams['employee_id'] = employeeId;
      if (leaveType != null) queryParams['leave_type'] = leaveType;

      final response = await _apiClient.get('/leaves', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => LeaveModel.fromJson(item))
              .toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch leaves: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<LeaveModel?> getLeaveById(int id) async {
    try {
      final response = await _apiClient.get('/leaves/$id');
      
      if (response.statusCode == 200) {
        return LeaveModel.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch leave: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<LeaveModel> createLeave(LeaveModel leave) async {
    try {
      final response = await _apiClient.post('/leaves', data: leave.toJson());
      
      if (response.statusCode == 201) {
        return LeaveModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to create leave',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to create leave: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<LeaveModel> updateLeave(int id, LeaveModel leave) async {
    try {
      final response = await _apiClient.put('/leaves/$id', data: leave.toJson());
      
      if (response.statusCode == 200) {
        return LeaveModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to update leave',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to update leave: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> deleteLeave(int id) async {
    try {
      final response = await _apiClient.delete('/leaves/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete leave',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      throw ApiException(
        message: 'Failed to delete leave: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<LeaveModel> approveLeave(int id) async {
    try {
      final response = await _apiClient.post('/leaves/$id/approve');
      
      if (response.statusCode == 200) {
        return LeaveModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to approve leave',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to approve leave: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<LeaveModel> rejectLeave(int id, String reason) async {
    try {
      final response = await _apiClient.post('/leaves/$id/reject', data: {
        'rejection_reason': reason,
      });
      
      if (response.statusCode == 200) {
        return LeaveModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to reject leave',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to reject leave: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<LeaveModel>> getEmployeeLeaves(int employeeId) async {
    try {
      final response = await _apiClient.get('/leaves/employee/$employeeId');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.map((item) => LeaveModel.fromJson(item)).toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch employee leaves: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<LeaveModel>> getPendingApprovals() async {
    try {
      final response = await _apiClient.get('/leaves/pending-approvals');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.map((item) => LeaveModel.fromJson(item)).toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch pending approvals: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
