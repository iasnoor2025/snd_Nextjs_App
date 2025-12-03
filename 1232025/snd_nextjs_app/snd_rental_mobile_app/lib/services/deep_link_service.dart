import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants/app_constants.dart';
import 'auth_service.dart';

class DeepLinkService {
  static final DeepLinkService _instance = DeepLinkService._internal();
  factory DeepLinkService() => _instance;
  DeepLinkService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  /// Handle deep link from Next.js app
  /// URL format: sndrental://login?token=ACCESS_TOKEN&refresh=REFRESH_TOKEN
  Future<bool> handleLoginDeepLink(String url) async {
    try {
      if (kDebugMode) {
        print('🔗 Deep Link Received: $url');
      }

      // Parse URL parameters
      final uri = Uri.parse(url);
      
      if (uri.scheme == 'sndrental' && uri.host == 'login') {
        final accessToken = uri.queryParameters['token'];
        final refreshToken = uri.queryParameters['refresh'];
        final userData = uri.queryParameters['user'];

        if (accessToken != null && refreshToken != null) {
          // Store tokens
          await _secureStorage.write(
            key: AppConstants.accessTokenKey,
            value: accessToken,
          );
          await _secureStorage.write(
            key: AppConstants.refreshTokenKey,
            value: refreshToken,
          );
          
          if (userData != null) {
            await _secureStorage.write(
              key: AppConstants.userDataKey,
              value: userData,
            );
          }

          // Notify auth service
          final authService = AuthService();
          await authService.isTokenValid();

          if (kDebugMode) {
            print('✅ Login via deep link successful');
          }
          
          return true;
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ Deep link error: $e');
      }
    }
    
    return false;
  }

  /// Generate deep link URL for Next.js app
  String generateLoginUrl({
    required String accessToken,
    required String refreshToken,
    String? userData,
  }) {
    final params = <String, String>{
      'token': accessToken,
      'refresh': refreshToken,
    };
    
    if (userData != null) {
      params['user'] = userData;
    }

    final uri = Uri(
      scheme: 'sndrental',
      host: 'login',
      queryParameters: params,
    );

    return uri.toString();
  }
}
