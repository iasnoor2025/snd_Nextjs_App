import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';
import '../errors/api_exception.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  late Dio _dio;
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  void initialize() {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(milliseconds: AppConstants.connectionTimeout),
      receiveTimeout: const Duration(milliseconds: AppConstants.receiveTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request Interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add NextAuth.js session cookie instead of Bearer token
          final sessionCookie = await _secureStorage.read(key: AppConstants.sessionCookieKey);
          if (sessionCookie != null) {
            options.headers['Cookie'] = sessionCookie;
            if (kDebugMode) {
              print('🍪 Added session cookie to request: ${options.uri}');
            }
          } else {
            if (kDebugMode) {
              print('🍪 No session cookie found for request: ${options.uri}');
            }
          }
          
          // Log request
          if (kDebugMode) {
            print('🚀 REQUEST: ${options.method} ${options.uri}');
            print('📤 HEADERS: ${options.headers}');
            if (options.data != null) {
              print('📤 DATA: ${options.data}');
            }
          }
          
          handler.next(options);
        },
        onResponse: (response, handler) {
          // Log response
          if (kDebugMode) {
            print('✅ RESPONSE: ${response.statusCode} ${response.requestOptions.uri}');
            print('📥 DATA: ${response.data}');
          }
          
          handler.next(response);
        },
        onError: (error, handler) async {
          // Log error
          if (kDebugMode) {
            print('❌ ERROR: ${error.response?.statusCode} ${error.requestOptions.uri}');
            print('📥 ERROR DATA: ${error.response?.data}');
          }
          
          // Handle session refresh for NextAuth.js
          if (error.response?.statusCode == 401) {
            final refreshed = await _refreshSession();
            if (refreshed) {
              // Retry the request
              final options = error.requestOptions;
              final sessionCookie = await _secureStorage.read(key: AppConstants.sessionCookieKey);
              if (sessionCookie != null) {
                options.headers['Cookie'] = sessionCookie;
              }
              
              try {
                final response = await _dio.fetch(options);
                handler.resolve(response);
                return;
              } catch (e) {
                // If retry fails, proceed with original error
              }
            }
          }
          
          handler.next(error);
        },
      ),
    );
  }

  Future<bool> _refreshSession() async {
    try {
      // For NextAuth.js, we need to call the mobile session endpoint to refresh
      final response = await Dio().get(
        '${AppConstants.baseUrl}/auth/mobile-session',
        options: Options(
          headers: {
            'Cookie': await _secureStorage.read(key: AppConstants.sessionCookieKey) ?? '',
          },
        ),
      );

      if (response.statusCode == 200) {
        // Session is still valid
        return true;
      }
    } catch (e) {
      if (kDebugMode) {
        print('Session refresh failed: $e');
      }
    }
    return false;
  }

  // HTTP Methods
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.post(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.put(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> delete(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.delete(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<Response> uploadFile(String path, String filePath, {Map<String, dynamic>? data}) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
        if (data != null) ...data,
      });

      return await _dio.post(path, data: formData);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  ApiException _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message: AppConstants.networkErrorMessage,
          statusCode: error.response?.statusCode,
          type: ApiExceptionType.timeout,
        );
      
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data?['message'] ?? AppConstants.serverErrorMessage;
        
        return ApiException(
          message: message,
          statusCode: statusCode,
          type: _getExceptionType(statusCode),
        );
      
      case DioExceptionType.cancel:
        return ApiException(
          message: 'Request was cancelled',
          statusCode: null,
          type: ApiExceptionType.cancelled,
        );
      
      case DioExceptionType.connectionError:
        return ApiException(
          message: AppConstants.networkErrorMessage,
          statusCode: null,
          type: ApiExceptionType.network,
        );
      
      default:
        return ApiException(
          message: AppConstants.unknownErrorMessage,
          statusCode: error.response?.statusCode,
          type: ApiExceptionType.unknown,
        );
    }
  }

  ApiExceptionType _getExceptionType(int? statusCode) {
    switch (statusCode) {
      case 400:
        return ApiExceptionType.badRequest;
      case 401:
        return ApiExceptionType.unauthorized;
      case 403:
        return ApiExceptionType.forbidden;
      case 404:
        return ApiExceptionType.notFound;
      case 500:
        return ApiExceptionType.serverError;
      default:
        return ApiExceptionType.unknown;
    }
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: AppConstants.accessTokenKey);
    await _secureStorage.delete(key: AppConstants.refreshTokenKey);
  }
}
