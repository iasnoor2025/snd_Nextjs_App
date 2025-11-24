import 'package:flutter/foundation.dart';
import '../../data/models/equipment_document_model.dart';
import '../../data/repositories/equipment_document_repository.dart';

class EquipmentDocumentProvider extends ChangeNotifier {
  final EquipmentDocumentRepository _repository;

  EquipmentDocumentProvider(this._repository);

  List<EquipmentDocumentModel> _documents = [];
  bool _isLoading = false;
  String? _error;

  List<EquipmentDocumentModel> get documents => _documents;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadDocuments(int equipmentId) async {
    _setLoading(true);
    _clearError();

    try {
      print('📋 Loading documents for equipment: $equipmentId');
      _documents = await _repository.getDocumentsByEquipmentId(equipmentId);
      print('📋 Loaded ${_documents.length} documents');
    } catch (e) {
      print('📋 Error loading documents: $e');
      _setError('Failed to load documents: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> uploadDocument({
    required int equipmentId,
    required String filePath,
    required String fileName,
    required String documentType,
    String? description,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      print('📤 Uploading document: $fileName');
      final newDocument = await _repository.uploadDocument(
        equipmentId: equipmentId,
        filePath: filePath,
        fileName: fileName,
        documentType: documentType,
        description: description,
      );
      
      // Add the new document to the list
      _documents.insert(0, newDocument);
      print('📤 Successfully uploaded document');
      return true;
    } catch (e) {
      print('📤 Error uploading document: $e');
      _setError('Failed to upload document: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deleteDocument(int documentId) async {
    _setLoading(true);
    _clearError();

    try {
      print('🗑️ Deleting document: $documentId');
      await _repository.deleteDocument(documentId);
      
      // Remove the document from the list
      _documents.removeWhere((doc) => doc.id == documentId);
      print('🗑️ Successfully deleted document');
      return true;
    } catch (e) {
      print('🗑️ Error deleting document: $e');
      _setError('Failed to delete document: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }

  // Helper methods
  List<EquipmentDocumentModel> getDocumentsByType(String documentType) {
    return _documents.where((doc) => doc.documentType == documentType).toList();
  }

  List<String> getDocumentTypes() {
    return _documents.map((doc) => doc.documentType).toSet().toList()..sort();
  }

  int getDocumentCount() {
    return _documents.length;
  }

  int getDocumentCountByType(String documentType) {
    return _documents.where((doc) => doc.documentType == documentType).length;
  }

  void clearDocuments() {
    _documents.clear();
    _clearError();
    notifyListeners();
  }
}
