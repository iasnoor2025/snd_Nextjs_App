// import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart';
import '../core/constants/app_constants.dart';
import '../core/network/api_client.dart';
import '../core/errors/api_exception.dart';

class AuthService extends ChangeNotifier {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: AppConstants.googleClientId,
    scopes: ['email', 'profile'],
  );
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final ApiClient _apiClient = ApiClient();

  GoogleSignInAccount? _currentUser;
  
  GoogleSignInAccount? get currentUser => _currentUser;
  
  bool get isLoggedIn {
    // Check if we have either a Google user or a session cookie
    return _currentUser != null || _hasSessionCookie();
  }
  
  bool _hasSessionCookie() {
    // This is a synchronous check, so we'll use a simple approach
    // In a real app, you might want to make this async
    return false; // We'll check this properly in isTokenValid()
  }

  Future<GoogleSignInAccount?> signInWithGoogle() async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        throw ApiException(
          message: 'Google sign-in was cancelled',
          type: ApiExceptionType.cancelled,
        );
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Send the token to your Next.js backend for verification
      if (googleAuth.idToken != null) {
        await _authenticateWithBackend(googleAuth.idToken!);
      }

      _currentUser = googleUser;
      notifyListeners();
      return googleUser;
    } catch (e) {
      throw ApiException(
        message: 'Authentication failed: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> _authenticateWithBackend(String idToken) async {
    try {
      final response = await _apiClient.post('/auth/google', data: {
        'idToken': idToken,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        await _secureStorage.write(
          key: AppConstants.accessTokenKey,
          value: data['accessToken'],
        );
        await _secureStorage.write(
          key: AppConstants.refreshTokenKey,
          value: data['refreshToken'],
        );
        if (data['user'] != null) {
          await _secureStorage.write(
            key: AppConstants.userDataKey,
            value: data['user'].toString(),
          );
        }
      } else {
        throw ApiException(
          message: 'Backend authentication failed: ${response.data}',
          type: ApiExceptionType.unauthorized,
        );
      }
    } catch (e) {
      await signOut();
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      
      // Clear session cookie
      await _secureStorage.delete(key: AppConstants.sessionCookieKey);
      await _secureStorage.delete(key: AppConstants.userDataKey);
      
      _currentUser = null;
      notifyListeners();
    } catch (e) {
      throw ApiException(
        message: 'Sign out failed: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: AppConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConstants.refreshTokenKey);
  }

  Future<Map<String, dynamic>?> getUserData() async {
    final userDataString = await _secureStorage.read(key: AppConstants.userDataKey);
    if (userDataString != null && _currentUser != null) {
      return {
        'email': _currentUser!.email,
        'displayName': _currentUser!.displayName,
        'photoUrl': _currentUser!.photoUrl,
      };
    }
    return null;
  }

  Future<bool> isTokenValid() async {
    // Check if we have a session cookie stored
    final sessionCookie = await _secureStorage.read(key: AppConstants.sessionCookieKey);
    if (sessionCookie == null) return false;

    try {
      // Verify session with backend
      final response = await _apiClient.get('/auth/me');
      return response.statusCode == 200;
    } catch (e) {
      // If session is invalid, clear it
      await _secureStorage.delete(key: AppConstants.sessionCookieKey);
      return false;
    }
  }

  /// Login with email and password (for Next.js app users)
  Future<Map<String, dynamic>?> loginWithEmail(String email, String password) async {
    try {
      if (kDebugMode) {
        print('🔐 Attempting email login for: $email');
      }

      // Use custom mobile signin endpoint
      final response = await _apiClient.post('/auth/mobile-signin', data: {
        'email': email,
        'password': password,
      });

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
            
            _currentUser = null; // Email login doesn't use GoogleSignInAccount
            notifyListeners();
            
            if (kDebugMode) {
              print('✅ Login successful for: $email');
            }
            
            return response.data;
          }
        }
      }
      
      return null;
      
    } catch (e) {
      if (kDebugMode) {
        print('❌ Email login error: $e');
      }
      throw ApiException(
        message: 'Email login failed: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
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
}