enum ApiExceptionType {
  network,
  timeout,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  cancelled,
  unknown,
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final ApiExceptionType type;

  ApiException({
    required this.message,
    this.statusCode,
    required this.type,
  });

  @override
  String toString() {
    return 'ApiException: $message (Status: $statusCode, Type: $type)';
  }
}
