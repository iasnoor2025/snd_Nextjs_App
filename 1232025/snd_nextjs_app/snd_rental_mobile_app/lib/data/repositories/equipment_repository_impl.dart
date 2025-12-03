import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';
import '../../domain/repositories/equipment_repository.dart';
import '../models/equipment_model.dart';

class EquipmentRepositoryImpl implements EquipmentRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<EquipmentModel>> getEquipment({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? category,
    String? location,
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
      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }
      if (location != null && location.isNotEmpty) {
        queryParams['location'] = location;
      }

      final response = await _apiClient.get('/equipment', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => EquipmentModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch equipment',
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
  Future<EquipmentModel?> getEquipmentById(String id) async {
    try {
      print('🔍 Fetching equipment by ID: $id');
      final response = await _apiClient.get('/equipment/$id');
      print('📡 API Response status: ${response.statusCode}');
      print('📋 API Response data: ${response.data}');
      
      if (response.statusCode == 200) {
        // The API returns data wrapped in a 'data' field
        final data = response.data['data'];
        print('📦 Equipment data: $data');
        if (data != null) {
          final equipment = EquipmentModel.fromJson(data);
          print('✅ Equipment parsed successfully: ${equipment.name}');
          return equipment;
        } else {
          print('❌ Equipment data not found in response');
          throw ApiException(
            message: 'Equipment data not found in response',
            type: ApiExceptionType.serverError,
          );
        }
      } else if (response.statusCode == 404) {
        print('❌ Equipment not found (404)');
        return null;
      } else {
        print('❌ API Error: ${response.statusCode}');
        throw ApiException(
          message: 'Failed to fetch equipment',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      print('❌ Unexpected error: $e');
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<EquipmentModel> createEquipment(EquipmentModel equipment) async {
    try {
      final response = await _apiClient.post('/equipment', data: equipment.toJson());
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return EquipmentModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to create equipment',
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
  Future<EquipmentModel> updateEquipment(String id, EquipmentModel equipment) async {
    try {
      final response = await _apiClient.put('/equipment/$id', data: equipment.toJson());
      
      if (response.statusCode == 200) {
        return EquipmentModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to update equipment',
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
  Future<void> deleteEquipment(String id) async {
    try {
      final response = await _apiClient.delete('/equipment/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete equipment',
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
  Future<List<Map<String, dynamic>>> getEquipmentDocuments(String equipmentId) async {
    try {
      final response = await _apiClient.get('/equipment/$equipmentId/documents');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch equipment documents',
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
  Future<Map<String, dynamic>> uploadEquipmentDocument(
    String equipmentId,
    String filePath,
    String documentType,
  ) async {
    try {
      final response = await _apiClient.uploadFile(
        '/equipment/$equipmentId/documents',
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
  Future<List<Map<String, dynamic>>> getEquipmentMaintenanceHistory(String equipmentId) async {
    try {
      final response = await _apiClient.get('/equipment/$equipmentId/maintenance');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch maintenance history',
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
  Future<Map<String, dynamic>> addMaintenanceRecord(
    String equipmentId,
    Map<String, dynamic> maintenanceData,
  ) async {
    try {
      final response = await _apiClient.post(
        '/equipment/$equipmentId/maintenance',
        data: maintenanceData,
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to add maintenance record',
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
  Future<List<Map<String, dynamic>>> getEquipmentRentalHistory(String equipmentId) async {
    try {
      final response = await _apiClient.get('/equipment/$equipmentId/rental-history');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch rental history',
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
  Future<void> assignEquipmentToProject(String equipmentId, String projectId) async {
    try {
      final response = await _apiClient.post(
        '/equipment/$equipmentId/assign',
        data: {'projectId': projectId},
      );
      
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw ApiException(
          message: 'Failed to assign equipment',
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
  Future<void> unassignEquipmentFromProject(String equipmentId) async {
    try {
      final response = await _apiClient.post('/equipment/$equipmentId/unassign');
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to unassign equipment',
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
  Future<void> assignEquipmentToEmployee(String equipmentId, String employeeId) async {
    try {
      final response = await _apiClient.post(
        '/equipment/$equipmentId/assign-employee',
        data: {'employeeId': employeeId},
      );
      
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw ApiException(
          message: 'Failed to assign equipment to employee',
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
  Future<void> unassignEquipmentFromEmployee(String equipmentId) async {
    try {
      final response = await _apiClient.post('/equipment/$equipmentId/unassign-employee');
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to unassign equipment from employee',
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
  Future<void> updateEquipmentStatus(String equipmentId, String status) async {
    try {
      final response = await _apiClient.put(
        '/equipment/$equipmentId/status',
        data: {'status': status},
      );
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to update equipment status',
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
  Future<void> updateEquipmentLocation(String equipmentId, String location) async {
    try {
      final response = await _apiClient.put(
        '/equipment/$equipmentId/location',
        data: {'location': location},
      );
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to update equipment location',
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
  Future<List<EquipmentModel>> searchEquipment(String query) async {
    try {
      final response = await _apiClient.get('/equipment/search', queryParameters: {'q': query});
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => EquipmentModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to search equipment',
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
  Future<List<EquipmentModel>> getEquipmentByStatus(String status) async {
    return getEquipment(status: status);
  }

  @override
  Future<List<EquipmentModel>> getAvailableEquipment() async {
    return getEquipment(status: 'available');
  }

  @override
  Future<List<EquipmentModel>> getEquipmentByCategory(String category) async {
    return getEquipment(category: category);
  }

  @override
  Future<List<EquipmentModel>> getEquipmentByLocation(String location) async {
    return getEquipment(location: location);
  }

  @override
  Future<List<EquipmentModel>> getMaintenanceDueEquipment() async {
    try {
      final response = await _apiClient.get('/equipment/maintenance-due');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => EquipmentModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch maintenance due equipment',
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
  Future<Map<String, dynamic>> getEquipmentStatistics() async {
    try {
      final response = await _apiClient.get('/equipment/statistics');
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to fetch equipment statistics',
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
}
