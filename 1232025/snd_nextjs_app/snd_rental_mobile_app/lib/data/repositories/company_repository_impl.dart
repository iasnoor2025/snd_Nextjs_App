import '../models/company_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

class CompanyRepositoryImpl {
  final ApiClient _apiClient = ApiClient();

  Future<CompanyModel?> getCompany() async {
    try {
      final response = await _apiClient.get('/companies');
      
      if (response.statusCode == 200) {
        return CompanyModel.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch company: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<CompanyModel> updateCompany(int id, CompanyModel company) async {
    try {
      final response = await _apiClient.put('/companies/$id', data: company.toJson());
      
      if (response.statusCode == 200) {
        return CompanyModel.fromJson(response.data);
      }
      
      throw ApiException(
        message: 'Failed to update company',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to update company: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<Map<String, dynamic>>> getDocumentTypes() async {
    try {
      final response = await _apiClient.get('/company-document-types');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch document types: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> createDocumentType(Map<String, dynamic> documentType) async {
    try {
      final response = await _apiClient.post('/company-document-types', data: documentType);
      
      if (response.statusCode == 201) {
        return response.data;
      }
      
      throw ApiException(
        message: 'Failed to create document type',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to create document type: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<List<Map<String, dynamic>>> getCompanyDocuments() async {
    try {
      final response = await _apiClient.get('/company-documents');
      
      if (response.statusCode == 200) {
        final data = response.data;
        if (data is List) {
          return data.cast<Map<String, dynamic>>();
        }
      }
      
      return [];
    } catch (e) {
      throw ApiException(
        message: 'Failed to fetch company documents: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<Map<String, dynamic>> uploadCompanyDocument(String filePath, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.uploadFile('/company-documents', filePath, data: data);
      
      if (response.statusCode == 201) {
        return response.data;
      }
      
      throw ApiException(
        message: 'Failed to upload company document',
        type: ApiExceptionType.serverError,
      );
    } catch (e) {
      throw ApiException(
        message: 'Failed to upload company document: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
