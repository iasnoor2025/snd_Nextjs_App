import '../models/quotation_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class QuotationRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<List<QuotationModel>> getQuotations({
    int page = 1,
    int limit = 20,
    String? status,
    int? customerId,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (status != null) queryParams['status'] = status;
      if (customerId != null) queryParams['customer_id'] = customerId;

      final response = await _apiClient.get('/quotations', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => QuotationModel.fromJson(item))
              .toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch quotations: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<QuotationModel?> getQuotationById(int id) async {
    try {
      final response = await _apiClient.get('/quotations/$id');
      
      if (response.statusCode == 200) {
        return QuotationModel.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<QuotationModel> createQuotation(QuotationModel quotation) async {
    try {
      final response = await _apiClient.post('/quotations', data: quotation.toJson());
      
      if (response.statusCode == 201) {
        return QuotationModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to create quotation',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to create quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<QuotationModel> updateQuotation(int id, QuotationModel quotation) async {
    try {
      final response = await _apiClient.put('/quotations/$id', data: quotation.toJson());
      
      if (response.statusCode == 200) {
        return QuotationModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to update quotation',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to update quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> deleteQuotation(int id) async {
    try {
      final response = await _apiClient.delete('/quotations/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete quotation',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      throw ApiException(
        message: 'Failed to delete quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<QuotationModel> sendQuotation(int id) async {
    try {
      final response = await _apiClient.post('/quotations/$id/send');
      
      if (response.statusCode == 200) {
        return QuotationModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to send quotation',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to send quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<QuotationModel> approveQuotation(int id) async {
    try {
      final response = await _apiClient.post('/quotations/$id/approve');
      
      if (response.statusCode == 200) {
        return QuotationModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to approve quotation',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to approve quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<QuotationModel> rejectQuotation(int id, String reason) async {
    try {
      final response = await _apiClient.post('/quotations/$id/reject', data: {
        'rejection_reason': reason,
      });
      
      if (response.statusCode == 200) {
        return QuotationModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to reject quotation',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to reject quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> convertToRental(int id) async {
    try {
      final response = await _apiClient.post('/quotations/$id/convert-to-rental');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      throw ApiException(
        message: 'Failed to convert quotation to rental',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to convert quotation to rental: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<String> printQuotation(int id) async {
    try {
      final response = await _apiClient.get('/quotations/$id/print');
      
      if (response.statusCode == 200) {
        return response.data['file_url'] ?? '';
      }
      
      throw ApiException(
        message: 'Failed to print quotation',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to print quotation: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
