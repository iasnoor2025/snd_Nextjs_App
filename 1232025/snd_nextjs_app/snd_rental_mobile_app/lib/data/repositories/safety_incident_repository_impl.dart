import '../models/safety_incident_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class SafetyIncidentRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<List<SafetyIncidentModel>> getSafetyIncidents({
    int page = 1,
    int limit = 20,
    String? status,
    String? severity,
    int? employeeId,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (status != null) queryParams['status'] = status;
      if (severity != null) queryParams['severity'] = severity;
      if (employeeId != null) queryParams['employee_id'] = employeeId;

      final response = await _apiClient.get('/safety-incidents', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => SafetyIncidentModel.fromJson(item))
              .toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch safety incidents: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<SafetyIncidentModel?> getSafetyIncidentById(int id) async {
    try {
      final response = await _apiClient.get('/safety-incidents/$id');
      
      if (response.statusCode == 200) {
        return SafetyIncidentModel.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch safety incident: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<SafetyIncidentModel> createSafetyIncident(SafetyIncidentModel incident) async {
    try {
      final response = await _apiClient.post('/safety-incidents', data: incident.toJson());
      
      if (response.statusCode == 201) {
        return SafetyIncidentModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to create safety incident',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to create safety incident: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<SafetyIncidentModel> updateSafetyIncident(int id, SafetyIncidentModel incident) async {
    try {
      final response = await _apiClient.put('/safety-incidents/$id', data: incident.toJson());
      
      if (response.statusCode == 200) {
        return SafetyIncidentModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to update safety incident',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to update safety incident: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> deleteSafetyIncident(int id) async {
    try {
      final response = await _apiClient.delete('/safety-incidents/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete safety incident',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      throw ApiException(
        message: 'Failed to delete safety incident: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<SafetyIncidentModel> assignIncident(int id, String assignedTo) async {
    try {
      final response = await _apiClient.post('/safety-incidents/$id/assign', data: {
        'assigned_to': assignedTo,
      });
      
      if (response.statusCode == 200) {
        return SafetyIncidentModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to assign incident',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to assign incident: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<SafetyIncidentModel> resolveIncident(int id, String resolution) async {
    try {
      final response = await _apiClient.post('/safety-incidents/$id/resolve', data: {
        'resolution': resolution,
      });
      
      if (response.statusCode == 200) {
        return SafetyIncidentModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to resolve incident',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to resolve incident: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<SafetyIncidentModel>> getIncidentsByEmployee(int employeeId) async {
    try {
      final response = await _apiClient.get('/safety-incidents/employee/$employeeId');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.map((item) => SafetyIncidentModel.fromJson(item)).toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch employee incidents: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> getIncidentStats() async {
    try {
      final response = await _apiClient.get('/safety-incidents/stats');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      return {};
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch incident stats: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
