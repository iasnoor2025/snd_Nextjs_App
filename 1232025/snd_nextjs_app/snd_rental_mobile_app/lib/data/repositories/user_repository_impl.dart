import '../models/user_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class UserRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<List<UserModel>> getUsers({
    int page = 1,
    int limit = 20,
    String? status,
    String? role,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (status != null) queryParams['status'] = status;
      if (role != null) queryParams['role'] = role;

      final response = await _apiClient.get('/users', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => UserModel.fromJson(item))
              .toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch users: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<UserModel?> getUserById(int id) async {
    try {
      final response = await _apiClient.get('/users/$id');
      
      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch user: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<UserModel> createUser(UserModel user) async {
    try {
      final response = await _apiClient.post('/users', data: user.toJson());
      
      if (response.statusCode == 201) {
        return UserModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to create user',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to create user: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<UserModel> updateUser(int id, UserModel user) async {
    try {
      final response = await _apiClient.put('/users/$id', data: user.toJson());
      
      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to update user',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to update user: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> deleteUser(int id) async {
    try {
      final response = await _apiClient.delete('/users/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete user',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      throw ApiException(
        message: 'Failed to delete user: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<Map<String, dynamic>>> getRoles() async {
    try {
      final response = await _apiClient.get('/roles');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch roles: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> createRole(Map<String, dynamic> role) async {
    try {
      final response = await _apiClient.post('/roles', data: role);
      
      if (response.statusCode == 201) {
        return response.data;
      }
      
      throw ApiException(
        message: 'Failed to create role',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to create role: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> updateRole(int id, Map<String, dynamic> role) async {
    try {
      final response = await _apiClient.put('/roles/$id', data: role);
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      throw ApiException(
        message: 'Failed to update role',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to update role: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<Map<String, dynamic>>> getPermissions() async {
    try {
      final response = await _apiClient.get('/permissions');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch permissions: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<Map<String, dynamic>>> getUserPermissions(int userId) async {
    try {
      final response = await _apiClient.get('/user-permissions', queryParameters: {
        'user_id': userId,
      });
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch user permissions: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> assignPermissions(Map<String, dynamic> assignment) async {
    try {
      final response = await _apiClient.post('/user-permissions', data: assignment);
      
      if (response.statusCode == 201) {
        return response.data;
      }
      
      throw ApiException(
        message: 'Failed to assign permissions',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to assign permissions: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
