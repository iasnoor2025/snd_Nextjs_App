import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';
import '../../domain/repositories/rental_repository.dart';
import '../models/rental_model.dart';

class RentalRepositoryImpl implements RentalRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<RentalModel>> getRentals({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? customerId,
    String? projectId,
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
      if (customerId != null && customerId.isNotEmpty) {
        queryParams['customerId'] = customerId;
      }
      if (projectId != null && projectId.isNotEmpty) {
        queryParams['projectId'] = projectId;
      }

      final response = await _apiClient.get('/rentals', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => RentalModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to fetch rentals',
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
  Future<RentalModel?> getRentalById(String id) async {
    try {
      final response = await _apiClient.get('/rentals/$id');
      
      if (response.statusCode == 200) {
        return RentalModel.fromJson(response.data);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw ApiException(
          message: 'Failed to fetch rental',
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
  Future<RentalModel> createRental(RentalModel rental) async {
    try {
      final response = await _apiClient.post('/rentals', data: rental.toJson());
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return RentalModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to create rental',
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
  Future<RentalModel> updateRental(String id, RentalModel rental) async {
    try {
      final response = await _apiClient.put('/rentals/$id', data: rental.toJson());
      
      if (response.statusCode == 200) {
        return RentalModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to update rental',
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
  Future<void> deleteRental(String id) async {
    try {
      final response = await _apiClient.delete('/rentals/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete rental',
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
  Future<List<Map<String, dynamic>>> getRentalItems(String rentalId) async {
    try {
      final response = await _apiClient.get('/rentals/$rentalId/items');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch rental items',
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
  Future<Map<String, dynamic>> addRentalItem(
    String rentalId,
    Map<String, dynamic> itemData,
  ) async {
    try {
      final response = await _apiClient.post(
        '/rentals/$rentalId/items',
        data: itemData,
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to add rental item',
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
  Future<Map<String, dynamic>> updateRentalItem(
    String rentalId,
    String itemId,
    Map<String, dynamic> itemData,
  ) async {
    try {
      final response = await _apiClient.put(
        '/rentals/$rentalId/items/$itemId',
        data: itemData,
      );
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to update rental item',
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
  Future<void> removeRentalItem(String rentalId, String itemId) async {
    try {
      final response = await _apiClient.delete('/rentals/$rentalId/items/$itemId');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to remove rental item',
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
  Future<Map<String, dynamic>> generateQuotation(String rentalId) async {
    try {
      final response = await _apiClient.post('/rentals/$rentalId/quotation');
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to generate quotation',
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
  Future<void> approveRental(String rentalId) async {
    try {
      final response = await _apiClient.post('/rentals/$rentalId/approve');
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to approve rental',
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
  Future<void> activateRental(String rentalId) async {
    try {
      final response = await _apiClient.post('/rentals/$rentalId/activate');
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to activate rental',
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
  Future<void> completeRental(String rentalId) async {
    try {
      final response = await _apiClient.post('/rentals/$rentalId/complete');
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to complete rental',
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
  Future<void> cancelRental(String rentalId) async {
    try {
      final response = await _apiClient.post('/rentals/$rentalId/cancel');
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to cancel rental',
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
  Future<List<Map<String, dynamic>>> getRentalHistory(String rentalId) async {
    try {
      final response = await _apiClient.get('/rentals/$rentalId/history');
      
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
  Future<List<Map<String, dynamic>>> getRentalPayments(String rentalId) async {
    try {
      final response = await _apiClient.get('/rentals/$rentalId/payments');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.cast<Map<String, dynamic>>();
      } else {
        throw ApiException(
          message: 'Failed to fetch rental payments',
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
  Future<Map<String, dynamic>> addRentalPayment(
    String rentalId,
    Map<String, dynamic> paymentData,
  ) async {
    try {
      final response = await _apiClient.post(
        '/rentals/$rentalId/payments',
        data: paymentData,
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to add payment',
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
  Future<void> updateRentalStatus(String rentalId, String status) async {
    try {
      final response = await _apiClient.put(
        '/rentals/$rentalId/status',
        data: {'status': status},
      );
      
      if (response.statusCode != 200) {
        throw ApiException(
          message: 'Failed to update rental status',
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
  Future<List<RentalModel>> searchRentals(String query) async {
    try {
      final response = await _apiClient.get('/rentals/search', queryParameters: {'q': query});
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data;
        return data.map((json) => RentalModel.fromJson(json)).toList();
      } else {
        throw ApiException(
          message: 'Failed to search rentals',
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
  Future<List<RentalModel>> getRentalsByStatus(String status) async {
    return getRentals(status: status);
  }

  @override
  Future<List<RentalModel>> getRentalsByCustomer(String customerId) async {
    return getRentals(customerId: customerId);
  }

  @override
  Future<List<RentalModel>> getRentalsByProject(String projectId) async {
    return getRentals(projectId: projectId);
  }

  @override
  Future<List<RentalModel>> getPendingRentals() async {
    return getRentals(status: 'pending');
  }

  @override
  Future<List<RentalModel>> getActiveRentals() async {
    return getRentals(status: 'active');
  }

  @override
  Future<Map<String, dynamic>> getRentalStatistics() async {
    try {
      final response = await _apiClient.get('/rentals/statistics');
      
      if (response.statusCode == 200) {
        return response.data;
      } else {
        throw ApiException(
          message: 'Failed to fetch rental statistics',
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
