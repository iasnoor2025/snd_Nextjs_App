import 'package:flutter/foundation.dart';
import '../models/user_profile_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class UserProfileRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  /// Fetch current user profile data from /api/auth/me
  Future<UserProfileModel> getCurrentUserProfile() async {
    try {
      if (kDebugMode) {
        print('🔍 Fetching current user profile...');
      }

      final response = await _apiClient.get('/auth/me');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true && data['user'] != null) {
          final userProfile = UserProfileModel.fromJson(data['user']);
          
          if (kDebugMode) {
            print('✅ User profile fetched successfully: ${userProfile.email}');
          }
          
          return userProfile;
        } else {
          throw ApiException(
            message: 'Invalid response format from server',
            type: ApiExceptionType.unknown,
          );
        }
      } else {
        throw ApiException(
          message: 'Failed to fetch user profile: ${response.statusCode}',
          type: ApiExceptionType.unauthorized,
        );
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error fetching user profile: $e');
      }
      
      if (e is ApiException) {
        rethrow;
      } else {
        throw ApiException(
          message: 'Network error: ${e.toString()}',
          type: ApiExceptionType.network,
        );
      }
    }
  }

  /// Fetch employee data for the current user
  Future<Map<String, dynamic>?> getEmployeeData(int userId) async {
    try {
      if (kDebugMode) {
        print('🔍 Fetching employee data for user ID: $userId');
      }

      final response = await _apiClient.get('/employees/by-user/$userId');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true && data['employee'] != null) {
          if (kDebugMode) {
            print('✅ Employee data fetched successfully');
          }
          return data['employee'];
        } else {
          if (kDebugMode) {
            print('⚠️ No employee data found for user');
          }
          return null;
        }
      } else if (response.statusCode == 404) {
        if (kDebugMode) {
          print('⚠️ No employee record found for user');
        }
        return null;
      } else {
        throw ApiException(
          message: 'Failed to fetch employee data: ${response.statusCode}',
          type: ApiExceptionType.unauthorized,
        );
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error fetching employee data: $e');
      }
      
      if (e is ApiException) {
        rethrow;
      } else {
        throw ApiException(
          message: 'Network error: ${e.toString()}',
          type: ApiExceptionType.network,
        );
      }
    }
  }

  /// Fetch user session data from /api/auth/mobile-session
  Future<Map<String, dynamic>> getSessionData() async {
    try {
      if (kDebugMode) {
        print('🔍 Fetching session data...');
      }

      final response = await _apiClient.get('/auth/mobile-session');

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true && data['session'] != null) {
          if (kDebugMode) {
            print('✅ Session data fetched successfully');
          }
          return data['session'];
        } else {
          throw ApiException(
            message: 'Invalid session response format',
            type: ApiExceptionType.unknown,
          );
        }
      } else {
        throw ApiException(
          message: 'Failed to fetch session: ${response.statusCode}',
          type: ApiExceptionType.unauthorized,
        );
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Error fetching session data: $e');
      }
      
      if (e is ApiException) {
        rethrow;
      } else {
        throw ApiException(
          message: 'Network error: ${e.toString()}',
          type: ApiExceptionType.network,
        );
      }
    }
  }
}
