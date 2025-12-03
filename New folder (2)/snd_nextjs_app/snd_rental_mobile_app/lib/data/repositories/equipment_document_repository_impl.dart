import 'package:dio/dio.dart';
import '../models/equipment_document_model.dart';
import 'equipment_document_repository.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_constants.dart';

class EquipmentDocumentRepositoryImpl implements EquipmentDocumentRepository {
  final ApiClient _apiClient;

  EquipmentDocumentRepositoryImpl(this._apiClient);

  @override
  Future<List<EquipmentDocumentModel>> getDocumentsByEquipmentId(int equipmentId) async {
    try {
      print('📋 Fetching documents for equipment ID: $equipmentId');
      print('📋 Full API URL: ${AppConstants.baseUrl}/equipment/$equipmentId/documents');
      
      final response = await _apiClient.get('/equipment/$equipmentId/documents');
      print('📋 Documents API response: ${response.statusCode}');
      print('📋 Documents API data: ${response.data}');
      print('📋 Response headers: ${response.headers}');
      
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        print('📋 Raw API response data: $data');
        
        if (data['success'] == true && data['documents'] != null) {
          final documentsList = data['documents'] as List;
          print('📋 Documents list: $documentsList');
          
          final documents = <EquipmentDocumentModel>[];
          for (int i = 0; i < documentsList.length; i++) {
            try {
              print('📋 Processing document $i: ${documentsList[i]}');
              final document = EquipmentDocumentModel.fromJson(documentsList[i], equipmentId: equipmentId);
              documents.add(document);
            } catch (e) {
              print('📋 Error parsing document $i: $e');
              print('📋 Document data: ${documentsList[i]}');
              // Continue with other documents instead of failing completely
            }
          }
          
          print('📋 Successfully parsed ${documents.length} documents');
          return documents;
        } else {
          print('📋 API returned success=false or no documents');
          return [];
        }
      } else {
        print('📋 API request failed with status: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('📋 Error fetching documents: $e');
      print('📋 Error type: ${e.runtimeType}');
      if (e is DioException) {
        print('📋 Dio error response: ${e.response?.data}');
        print('📋 Dio error status: ${e.response?.statusCode}');
        print('📋 Dio error message: ${e.message}');
      }
      rethrow;
    }
  }

  @override
  Future<EquipmentDocumentModel> uploadDocument({
    required int equipmentId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? description,
  }) async {
    try {
      print('📤 Uploading document for equipment ID: $equipmentId');
      print('📤 File: $fileName, Type: $documentType');
      
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath, filename: fileName),
        'document_type': documentType,
        'document_name': fileName,
        if (description != null) 'description': description,
      });

      final response = await _apiClient.post(
        '/equipment/$equipmentId/documents',
        data: formData,
      );

      print('📤 Upload response: ${response.statusCode}');
      print('📤 Upload data: ${response.data}');

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data['success'] == true && data['data'] != null) {
          final document = EquipmentDocumentModel.fromJson(data['data'], equipmentId: equipmentId);
          print('📤 Successfully uploaded document: ${document.fileName}');
          return document;
        } else {
          throw Exception('Upload failed: ${data['error'] ?? 'Unknown error'}');
        }
      } else {
        throw Exception('Upload failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('📤 Error uploading document: $e');
      rethrow;
    }
  }

  @override
  Future<void> deleteDocument(int documentId) async {
    try {
      print('🗑️ Deleting document ID: $documentId');
      
      final response = await _apiClient.delete('/documents/$documentId');
      
      print('🗑️ Delete response: ${response.statusCode}');
      print('🗑️ Delete data: ${response.data}');

      if (response.statusCode == 200) {
        print('🗑️ Successfully deleted document');
      } else {
        throw Exception('Delete failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('🗑️ Error deleting document: $e');
      rethrow;
    }
  }
}
