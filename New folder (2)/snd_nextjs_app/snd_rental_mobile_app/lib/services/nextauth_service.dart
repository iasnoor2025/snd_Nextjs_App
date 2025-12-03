import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/app_constants.dart';

class NextAuthService {
  static final NextAuthService _instance = NextAuthService._internal();
  factory NextAuthService() => _instance;
  NextAuthService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final Dio _dio = Dio();

  /// Login with credentials (email/password)
  Future<Map<String, dynamic>?> loginWithCredentials({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '${AppConstants.baseUrl}/auth/signin',
        data: {
          'email': email,
          'password': password,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        // Extract session cookie from response headers
        final cookies = response.headers['set-cookie'];
        if (cookies != null && cookies.isNotEmpty) {
          final sessionCookie = _extractSessionCookie(cookies);
          if (sessionCookie != null) {
            await _secureStorage.write(
              key: AppConstants.sessionCookieKey,
              value: sessionCookie,
            );
            
            // Store user data
            await _secureStorage.write(
              key: AppConstants.userDataKey,
              value: response.data.toString(),
            );
            
            if (kDebugMode) {
              print('✅ Login successful for: $email');
            }
            
            return response.data;
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Login failed: $e');
      }
    }
    return null;
  }

  /// Login with Google OAuth
  Future<Map<String, dynamic>?> loginWithGoogle() async {
    try {
      // For Google OAuth, we need to redirect to the NextAuth.js Google provider
      final response = await _dio.get(
        '${AppConstants.baseUrl}/auth/signin/google',
        options: Options(
          followRedirects: false,
          validateStatus: (status) => status! < 400,
        ),
      );

      if (response.statusCode == 302 || response.statusCode == 200) {
        // Handle OAuth redirect
        final location = response.headers['location']?.first;
        if (location != null) {
          // Open browser for OAuth flow
          // This would typically open a web browser for the OAuth flow
          // and then handle the callback
          return {'redirectUrl': location};
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Google login failed: $e');
      }
    }
    return null;
  }

  /// Get current session
  Future<Map<String, dynamic>?> getSession() async {
    try {
      final sessionCookie = await _secureStorage.read(key: AppConstants.sessionCookieKey);
      if (sessionCookie == null) return null;

      final response = await _dio.get(
        '${AppConstants.baseUrl}/auth/session',
        options: Options(
          headers: {
            'Cookie': sessionCookie,
          },
        ),
      );

      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Get session failed: $e');
      }
    }
    return null;
  }

  /// Logout
  Future<bool> logout() async {
    try {
      final sessionCookie = await _secureStorage.read(key: AppConstants.sessionCookieKey);
      if (sessionCookie != null) {
        await _dio.post(
          '${AppConstants.baseUrl}/auth/signout',
          options: Options(
            headers: {
              'Cookie': sessionCookie,
            },
          ),
        );
      }

      // Clear stored data
      await _secureStorage.delete(key: AppConstants.sessionCookieKey);
      await _secureStorage.delete(key: AppConstants.userDataKey);
      
      if (kDebugMode) {
        print('✅ Logout successful');
      }
      
      return true;
    } catch (e) {
      if (kDebugMode) {
        print('❌ Logout failed: $e');
      }
      return false;
    }
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final session = await getSession();
    return session != null && session['user'] != null;
  }

  /// Get current user
  Future<Map<String, dynamic>?> getCurrentUser() async {
    final session = await getSession();
    return session?['user'];
  }

  /// Extract session cookie from Set-Cookie header
  String? _extractSessionCookie(List<String> cookies) {
    for (final cookie in cookies) {
      if (cookie.startsWith('next-auth.session-token=')) {
        // Extract the session token value
        final parts = cookie.split(';');
        if (parts.isNotEmpty) {
          return parts.first;
        }
      }
    }
    return null;
  }

  /// Set session cookie manually (for testing or after OAuth callback)
  Future<void> setSessionCookie(String cookie) async {
    await _secureStorage.write(
      key: AppConstants.sessionCookieKey,
      value: cookie,
    );
  }
}
