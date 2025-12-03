import '../models/report_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class ReportRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<List<ReportModel>> getReports({
    int page = 1,
    int limit = 20,
    String? type,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      
      if (type != null) queryParams['type'] = type;
      if (status != null) queryParams['status'] = status;

      final response = await _apiClient.get('/reports', queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is Map<String, dynamic> && data['data'] is List) {
          return (data['data'] as List)
              .map((item) => ReportModel.fromJson(item))
              .toList();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch reports: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<ReportModel?> getReportById(int id) async {
    try {
      final response = await _apiClient.get('/reports/$id');
      
      if (response.statusCode == 200) {
        return ReportModel.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch report: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<ReportModel> generateReport(Map<String, dynamic> reportData) async {
    try {
      final response = await _apiClient.post('/reports/generate', data: reportData);
      
      if (response.statusCode == 201) {
        return ReportModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to generate report',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to generate report: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> getAnalyticsOverview() async {
    try {
      final response = await _apiClient.get('/analytics/overview');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      return {};
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch analytics overview: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> getEmployeeAnalytics() async {
    try {
      final response = await _apiClient.get('/analytics/employee');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      return {};
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch employee analytics: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> getProjectAnalytics() async {
    try {
      final response = await _apiClient.get('/analytics/project');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      return {};
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch project analytics: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> getEquipmentAnalytics() async {
    try {
      final response = await _apiClient.get('/analytics/equipment');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      return {};
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch equipment analytics: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> getFinancialReports() async {
    try {
      final response = await _apiClient.get('/reports/financial');
      
      if (response.statusCode == 200) {
        return response.data;
      }
      
      return {};
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch financial reports: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<void> deleteReport(int id) async {
    try {
      final response = await _apiClient.delete('/reports/$id');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete report',
          type: ApiExceptionType.serverError,
        );
      }
    } catch (e) {
      throw ApiException(
        message: 'Failed to delete report: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
