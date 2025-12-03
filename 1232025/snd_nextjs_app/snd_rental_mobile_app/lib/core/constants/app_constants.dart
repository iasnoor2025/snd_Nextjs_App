class AppConstants {
  // API Configuration
  static const String baseUrl = 'https://myapp.snd-ksa.online/api';
  static const String apiVersion = 'v1';
  
  // Authentication
  static const String googleClientId = '241936842587-t28a4noogtteh97746j021efe6hd1jvn.apps.googleusercontent.com';
  static const String firebaseProjectId = 'YOUR_FIREBASE_PROJECT_ID';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String sessionCookieKey = 'nextauth_session_cookie';
  static const String userDataKey = 'user_data';
  static const String themeKey = 'theme_mode';
  
  // Database
  static const String databaseName = 'snd_rental.db';
  static const int databaseVersion = 1;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Timeouts
  static const int connectionTimeout = 30000; // 30 seconds
  static const int receiveTimeout = 30000; // 30 seconds
  
  // File Upload
  static const int maxFileSize = 10 * 1024 * 1024; // 10 MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif'];
  static const List<String> allowedDocumentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
  
  // Currency
  static const String currencySymbol = 'SAR';
  static const String currencyCode = 'SAR';
  
  // Date Formats
  static const String dateFormat = 'yyyy-MM-dd';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
  static const String displayDateFormat = 'MMM dd, yyyy';
  static const String displayDateTimeFormat = 'MMM dd, yyyy HH:mm';
  
  // App Information
  static const String appName = 'SND Rental Management';
  static const String appVersion = '1.0.0';
  static const String appBuildNumber = '1';
  
  // Error Messages
  static const String networkErrorMessage = 'Network connection error. Please check your internet connection.';
  static const String serverErrorMessage = 'Server error. Please try again later.';
  static const String unknownErrorMessage = 'An unknown error occurred. Please try again.';
  static const String authenticationErrorMessage = 'Authentication failed. Please login again.';
  
  // Success Messages
  static const String loginSuccessMessage = 'Login successful';
  static const String logoutSuccessMessage = 'Logout successful';
  static const String dataSavedMessage = 'Data saved successfully';
  static const String dataDeletedMessage = 'Data deleted successfully';
}
