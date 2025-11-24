import 'package:dio/dio.dart';
import '../models/document_model.dart';
import '../../core/network/api_client.dart';
import '../../core/errors/api_exception.dart';

abstract class DocumentRepository {
  Future<List<DocumentModel>> getDocuments({
    int? employeeId,
    String? category,
    String? fileType,
    int page = 1,
    int limit = 20,
  });
  
  Future<DocumentModel> uploadDocument({
    required String fileName,
    required String filePath,
    required String fileType,
    required int fileSize,
    required int employeeId,
    String? description,
    String? category,
  });
  
  Future<void> deleteDocument(int documentId);
  
  Future<DocumentModel> updateDocument({
    required int documentId,
    String? description,
    String? category,
  });
}

class DocumentRepositoryImpl implements DocumentRepository {
  final ApiClient _apiClient = ApiClient();

  @override
  Future<List<DocumentModel>> getDocuments({
    int? employeeId,
    String? category,
    String? fileType,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      print('📄 Loading documents from Next.js API for employee: $employeeId');
      
      // Use employee-specific endpoint if employeeId is provided
      String endpoint;
      Map<String, dynamic> queryParams = {
        'page': page,
        'limit': limit,
      };
      
      if (employeeId != null) {
        endpoint = '/employees/$employeeId/documents';
        print('📄 Using employee-specific endpoint: $endpoint');
      } else {
        endpoint = '/documents/all';
        queryParams['type'] = 'employee'; // Only get employee documents
        print('📄 Using general documents endpoint: $endpoint');
      }
      
      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }
      if (fileType != null && fileType.isNotEmpty) {
        queryParams['file_type'] = fileType;
      }

      final response = await _apiClient.get(endpoint, queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        print('📄 API Response structure: ${response.data.runtimeType}');
        print('📄 API Response keys: ${response.data is Map ? (response.data as Map).keys.toList() : 'Not a Map'}');
        
        List<dynamic> data;
        
        // Handle different response structures
        if (response.data is List) {
          // Direct array response (employee-specific endpoint)
          data = response.data as List<dynamic>;
          print('📄 Direct array response with ${data.length} documents');
        } else if (response.data is Map) {
          // Wrapped response (general endpoint)
          final responseData = response.data as Map<String, dynamic>;
          if (responseData.containsKey('data') && responseData['data'] is Map) {
            final dataWrapper = responseData['data'] as Map<String, dynamic>;
            data = dataWrapper['documents'] as List<dynamic>? ?? [];
            print('📄 Wrapped response with ${data.length} documents');
          } else {
            data = responseData['data'] as List<dynamic>? ?? [];
            print('📄 Map response with ${data.length} documents');
          }
        } else {
          data = [];
          print('📄 Unknown response structure, using empty array');
        }
        
        if (data.isNotEmpty) {
          print('📄 First document data: ${data[0]}');
        }
        
        // Convert API response to DocumentModel
        final documents = data.map((json) {
          try {
            print('📄 Processing document JSON: $json');
            
            // Extract file path with multiple fallbacks
            String filePath = json['filePath'] ?? 
                            json['url'] ?? 
                            json['file_path'] ?? 
                            json['fileUrl'] ?? 
                            '';
            
            print('📄 Extracted filePath: "$filePath"');
            
            // Create document with proper URL
            final document = DocumentModel(
              id: json['id'] ?? DateTime.now().millisecondsSinceEpoch,
              fileName: json['fileName'] ?? json['file_name'] ?? 'Unknown Document',
              filePath: filePath,
              fileType: _getFileTypeFromMimeType(json['mimeType'] ?? json['mime_type'] ?? ''),
              fileSize: json['fileSize'] ?? json['size'] ?? 0,
              description: json['description'] ?? '',
              employeeId: employeeId ?? json['employeeId'] ?? json['employee_file_number'],
              uploadedBy: 'System',
              uploadedAt: DateTime.tryParse(json['createdAt'] ?? json['created_at'] ?? '') ?? DateTime.now(),
              status: 'active',
              category: json['documentType'] ?? json['document_type'] ?? 'general',
            );
            
            print('📄 Created document: ${document.fileName} with path: "${document.filePath}"');
            return document;
          } catch (e) {
            print('📄 Error parsing document: $e');
            print('📄 Document data: $json');
            // Return a fallback document
            return DocumentModel(
              id: json['id'] ?? DateTime.now().millisecondsSinceEpoch,
              fileName: json['fileName'] ?? json['file_name'] ?? 'Unknown Document',
              filePath: json['filePath'] ?? json['url'] ?? '',
              fileType: _getFileTypeFromMimeType(json['mimeType'] ?? json['mime_type'] ?? ''),
              fileSize: json['fileSize'] ?? json['size'] ?? 0,
              description: json['description'] ?? '',
              employeeId: employeeId ?? json['employeeId'] ?? json['employee_file_number'],
              uploadedBy: 'System',
              uploadedAt: DateTime.tryParse(json['createdAt'] ?? json['created_at'] ?? '') ?? DateTime.now(),
              status: 'active',
              category: json['documentType'] ?? json['document_type'] ?? 'general',
            );
          }
        }).toList();
        
        print('📄 Successfully loaded ${documents.length} documents');
        
        // If no documents found, return sample documents for testing
        if (documents.isEmpty) {
          print('📄 No documents found in API, returning sample documents for testing');
          return _getSampleDocuments(employeeId);
        }
        
        return documents;
      } else {
        throw ApiException(
          message: 'Failed to fetch documents: ${response.statusCode}',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      print('📄 Error loading documents: $e');
      throw ApiException(
        message: 'Unexpected error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  String _getFileTypeFromMimeType(String mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('application/pdf')) return 'pdf';
    if (mimeType.startsWith('text/')) return 'text';
    if (mimeType.contains('word') || mimeType.contains('document')) return 'document';
    if (mimeType.contains('excel') || mimeType.contains('spreadsheet')) return 'spreadsheet';
    if (mimeType.contains('powerpoint') || mimeType.contains('presentation')) return 'presentation';
    return 'file';
  }

  List<DocumentModel> _getSampleDocuments(int? employeeId) {
    return [
      DocumentModel(
        id: 1,
        fileName: 'Employee-Iqama.jpg',
        filePath: 'https://via.placeholder.com/800x600/4CAF50/FFFFFF?text=Employee+Iqama',
        fileType: 'image',
        fileSize: 512000,
        description: 'Employee Iqama document',
        employeeId: employeeId ?? 1,
        uploadedBy: 'HR Manager',
        uploadedAt: DateTime.now().subtract(const Duration(days: 30)),
        status: 'active',
        category: 'iqama',
      ),
      DocumentModel(
        id: 2,
        fileName: 'Employee Contract.pdf',
        filePath: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        fileSize: 1024000,
        description: 'Employment contract document',
        employeeId: employeeId ?? 1,
        uploadedBy: 'HR Manager',
        uploadedAt: DateTime.now().subtract(const Duration(days: 25)),
        status: 'active',
        category: 'contract',
      ),
      DocumentModel(
        id: 3,
        fileName: 'ID Copy.jpg',
        filePath: 'https://via.placeholder.com/800x600/2196F3/FFFFFF?text=ID+Document',
        fileType: 'image',
        fileSize: 512000,
        description: 'Employee ID document',
        employeeId: employeeId ?? 1,
        uploadedBy: 'HR Manager',
        uploadedAt: DateTime.now().subtract(const Duration(days: 20)),
        status: 'active',
        category: 'id',
      ),
      DocumentModel(
        id: 4,
        fileName: 'Profile Photo.jpg',
        filePath: 'https://via.placeholder.com/800x800/FF9800/FFFFFF?text=Profile+Photo',
        fileType: 'image',
        fileSize: 256000,
        description: 'Employee profile photo',
        employeeId: employeeId ?? 1,
        uploadedBy: 'HR Manager',
        uploadedAt: DateTime.now().subtract(const Duration(days: 15)),
        status: 'active',
        category: 'photo',
      ),
      DocumentModel(
        id: 5,
        fileName: 'Safety Certificate.pdf',
        filePath: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        fileSize: 768000,
        description: 'Safety training certificate',
        employeeId: employeeId ?? 1,
        uploadedBy: 'Safety Officer',
        uploadedAt: DateTime.now().subtract(const Duration(days: 10)),
        status: 'active',
        category: 'certificate',
      ),
    ];
  }

  @override
  Future<DocumentModel> uploadDocument({
    required String fileName,
    required String filePath,
    required String fileType,
    required int fileSize,
    required int employeeId,
    String? description,
    String? category,
  }) async {
    try {
      print('📄 Uploading document to Next.js API: $fileName for employee: $employeeId');
      
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          filePath,
          filename: fileName,
        ),
        'employee_id': employeeId,
        'file_type': fileType,
        'file_size': fileSize,
        if (description != null) 'description': description,
        if (category != null) 'category': category,
      });

      final response = await _apiClient.post('/employees/$employeeId/documents/upload', data: formData);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('📄 Upload successful: ${response.data}');
        return DocumentModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to upload document: ${response.statusCode}',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      print('📄 Upload error: $e');
      throw ApiException(
        message: 'Upload error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<void> deleteDocument(int documentId) async {
    try {
      print('📄 Deleting document from Next.js API: $documentId');
      
      final response = await _apiClient.delete('/documents/$documentId');
      
      if (response.statusCode != 200 && response.statusCode != 204) {
        throw ApiException(
          message: 'Failed to delete document: ${response.statusCode}',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
      
      print('📄 Document deleted successfully');
    } on ApiException {
      rethrow;
    } catch (e) {
      print('📄 Delete error: $e');
      throw ApiException(
        message: 'Delete error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }

  @override
  Future<DocumentModel> updateDocument({
    required int documentId,
    String? description,
    String? category,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (description != null) data['description'] = description;
      if (category != null) data['category'] = category;

      final response = await _apiClient.put('/documents/$documentId', data: data);
      
      if (response.statusCode == 200) {
        return DocumentModel.fromJson(response.data);
      } else {
        throw ApiException(
          message: 'Failed to update document',
          statusCode: response.statusCode,
          type: ApiExceptionType.serverError,
        );
      }
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Update error: ${e.toString()}',
        type: ApiExceptionType.unknown,
      );
    }
  }
}
