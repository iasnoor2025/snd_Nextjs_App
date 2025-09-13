import 'package:dio/dio.dart';
import '../models/customer_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class CustomerRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<List<CustomerModel>> getCustomers({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
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

      final response = await _apiClient.get(
        '/customers',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('data')) {
          final List<dynamic> customersJson = data['data'];
          return customersJson
              .map((json) => CustomerModel.fromJson(json))
              .toList();
        } else if (data is List) {
          return data
              .map((json) => CustomerModel.fromJson(json))
              .toList();
        }
      }

      throw ApiException(
        message: 'Failed to fetch customers',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Error fetching customers: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<CustomerModel> getCustomerById(String id) async {
    try {
      final response = await _apiClient.get('/customers/$id');

      if (response.statusCode == 200) {
        return CustomerModel.fromJson(response.data);
      }

      throw ApiException(
        message: 'Customer not found',
        type: ApiExceptionType.notFound,
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Error fetching customer: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<CustomerModel> createCustomer(CustomerModel customer) async {
    try {
      final response = await _apiClient.post(
        '/customers',
        data: customer.toJson(),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return CustomerModel.fromJson(response.data);
      }

      throw ApiException(
        message: 'Failed to create customer',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Error creating customer: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<CustomerModel> updateCustomer(String id, CustomerModel customer) async {
    try {
      final response = await _apiClient.put(
        '/customers/$id',
        data: customer.toJson(),
      );

      if (response.statusCode == 200) {
        return CustomerModel.fromJson(response.data);
      }

      throw ApiException(
        message: 'Failed to update customer',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Error updating customer: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> deleteCustomer(String id) async {
    try {
      final response = await _apiClient.delete('/customers/$id');

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete customer',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Error deleting customer: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<CustomerModel>> getCustomersByStatus(String status) async {
    try {
      final response = await _apiClient.get(
        '/customers',
        queryParameters: {'status': status},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data
              .map((json) => CustomerModel.fromJson(json))
              .toList();
        }
      }

      throw ApiException(
        message: 'Failed to fetch customers by status',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Error fetching customers by status: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
