import 'package:flutter/foundation.dart';
import '../../data/repositories/document_repository_impl.dart';
import '../../data/models/document_model.dart';
import '../../core/errors/api_exception.dart';

class DocumentProvider extends ChangeNotifier {
  final DocumentRepository _documentRepository = DocumentRepositoryImpl();

  List<DocumentModel> _documents = [];
  List<DocumentModel> _filteredDocuments = [];
  DocumentModel? _selectedDocument;
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String? _categoryFilter;
  String? _fileTypeFilter;
  int? _employeeId;
  int _currentPage = 1;
  bool _hasMoreData = true;

  // Getters
  List<DocumentModel> get documents => _filteredDocuments;
  List<DocumentModel> get filteredDocuments => _filteredDocuments;
  DocumentModel? get selectedDocument => _selectedDocument;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get errorMessage => _error;
  bool get hasError => _error != null;
  String get searchQuery => _searchQuery;
  String? get categoryFilter => _categoryFilter;
  String? get fileTypeFilter => _fileTypeFilter;
  int? get employeeId => _employeeId;
  bool get hasMoreData => _hasMoreData;

  // Load documents
  Future<void> loadDocuments({
    bool refresh = false,
    int? employeeId,
    String? category,
    String? fileType,
  }) async {
    print('📄 loadDocuments called - refresh: $refresh, employeeId: $employeeId');
    print('📄 Current state - isLoading: $_isLoading, hasMoreData: $_hasMoreData');
    
    if (refresh) {
      _currentPage = 1;
      _hasMoreData = true;
      _documents.clear();
      _filteredDocuments.clear();
      print('📄 Refreshed - cleared documents and reset pagination');
    }

    if (_isLoading || !_hasMoreData) {
      print('📄 Skipping load - isLoading: $_isLoading, hasMoreData: $_hasMoreData');
      return;
    }

    _setLoading(true);
    _clearError();

    try {
      print('📄 Loading documents - Page: $_currentPage, Limit: 20');
      print('📄 Employee ID: ${employeeId ?? _employeeId}');
      print('📄 Category: ${category ?? _categoryFilter}');
      print('📄 File Type: ${fileType ?? _fileTypeFilter}');
      
      final newDocuments = await _documentRepository.getDocuments(
        employeeId: employeeId ?? _employeeId,
        category: category ?? _categoryFilter,
        fileType: fileType ?? _fileTypeFilter,
        page: _currentPage,
        limit: 20,
      );

      print('✅ Loaded ${newDocuments.length} documents');
      if (newDocuments.isNotEmpty) {
        print('📄 First document: ${newDocuments[0].displayName}');
        print('📄 Document categories: ${newDocuments.map((d) => d.category).toList()}');
      }

      if (refresh) {
        _documents = newDocuments;
        print('📄 Refreshed - set documents to ${_documents.length}');
      } else {
        _documents.addAll(newDocuments);
        print('📄 Added documents - total now: ${_documents.length}');
      }

      _hasMoreData = newDocuments.length == 20;
      _currentPage++;

      print('📄 About to apply filters with ${_documents.length} documents');
      _applyFilters();
    } on ApiException catch (e) {
      print('❌ API Exception: ${e.message}');
      _setError(e.message);
    } catch (e) {
      print('❌ General Exception: ${e.toString()}');
      _setError('Failed to load documents: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Load more documents (pagination)
  Future<void> loadMoreDocuments() async {
    await loadDocuments();
  }

  // Refresh documents
  Future<void> refreshDocuments() async {
    await loadDocuments(refresh: true);
  }

  // Upload document
  Future<void> uploadDocument({
    required String fileName,
    required String filePath,
    required String fileType,
    required int fileSize,
    String? description,
    String? category,
  }) async {
    if (_employeeId == null) {
      _setError('Employee ID is required for document upload');
      return;
    }

    _setLoading(true);
    _clearError();

    try {
      print('📤 Uploading document: $fileName');
      final newDocument = await _documentRepository.uploadDocument(
        fileName: fileName,
        filePath: filePath,
        fileType: fileType,
        fileSize: fileSize,
        employeeId: _employeeId!,
        description: description,
        category: category,
      );

      print('✅ Document uploaded successfully: ${newDocument.displayName}');
      
      // Add to the beginning of the list
      _documents.insert(0, newDocument);
      _applyFilters();
      
      notifyListeners();
    } on ApiException catch (e) {
      print('❌ Upload API Exception: ${e.message}');
      _setError(e.message);
    } catch (e) {
      print('❌ Upload General Exception: ${e.toString()}');
      _setError('Failed to upload document: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Delete document
  Future<void> deleteDocument(int documentId) async {
    _setLoading(true);
    _clearError();

    try {
      print('🗑️ Deleting document: $documentId');
      await _documentRepository.deleteDocument(documentId);
      
      print('✅ Document deleted successfully');
      
      // Remove from list
      _documents.removeWhere((doc) => doc.id == documentId);
      _applyFilters();
      
      notifyListeners();
    } on ApiException catch (e) {
      print('❌ Delete API Exception: ${e.message}');
      _setError(e.message);
    } catch (e) {
      print('❌ Delete General Exception: ${e.toString()}');
      _setError('Failed to delete document: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Update document
  Future<void> updateDocument({
    required int documentId,
    String? description,
    String? category,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      print('✏️ Updating document: $documentId');
      final updatedDocument = await _documentRepository.updateDocument(
        documentId: documentId,
        description: description,
        category: category,
      );
      
      print('✅ Document updated successfully: ${updatedDocument.displayName}');
      
      // Update in list
      final index = _documents.indexWhere((doc) => doc.id == documentId);
      if (index != -1) {
        _documents[index] = updatedDocument;
        _applyFilters();
      }
      
      notifyListeners();
    } on ApiException catch (e) {
      print('❌ Update API Exception: ${e.message}');
      _setError(e.message);
    } catch (e) {
      print('❌ Update General Exception: ${e.toString()}');
      _setError('Failed to update document: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  // Search documents
  void searchDocuments(String query) {
    _searchQuery = query;
    _applyFilters();
    notifyListeners();
  }

  // Set category filter
  void setCategoryFilter(String? category) {
    _categoryFilter = category;
    _applyFilters();
    notifyListeners();
  }

  // Set file type filter
  void setFileTypeFilter(String? fileType) {
    _fileTypeFilter = fileType;
    _applyFilters();
    notifyListeners();
  }

  // Set employee ID
  void setEmployeeId(int? employeeId) {
    _employeeId = employeeId;
    _applyFilters();
    notifyListeners();
  }

  // Clear all filters
  void clearFilters() {
    _searchQuery = '';
    _categoryFilter = null;
    _fileTypeFilter = null;
    _currentPage = 1;
    _hasMoreData = true;
    _applyFilters();
    
    // Load fresh data without filters
    loadDocuments(refresh: true);
  }

  // Apply filters to documents list
  void _applyFilters() {
    print('🔍 Applying filters - Total documents: ${_documents.length}');
    print('🔍 Search query: "$_searchQuery"');
    print('🔍 Category filter: "$_categoryFilter"');
    print('🔍 File type filter: "$_fileTypeFilter"');
    
    _filteredDocuments = List.from(_documents);
    print('🔍 After copying: ${_filteredDocuments.length} documents');

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      _filteredDocuments = _filteredDocuments.where((document) {
        final fileName = document.fileName.toLowerCase();
        final description = document.description?.toLowerCase() ?? '';
        final category = document.category?.toLowerCase() ?? '';
        final query = _searchQuery.toLowerCase();
        
        return fileName.contains(query) ||
               description.contains(query) ||
               category.contains(query);
      }).toList();
      print('🔍 After search filter: ${_filteredDocuments.length} documents');
    }

    // Apply category filter
    if (_categoryFilter != null) {
      _filteredDocuments = _filteredDocuments.where((document) {
        return document.category == _categoryFilter;
      }).toList();
      print('🔍 After category filter: ${_filteredDocuments.length} documents');
    }

    // Apply file type filter
    if (_fileTypeFilter != null) {
      _filteredDocuments = _filteredDocuments.where((document) {
        return document.fileType == _fileTypeFilter;
      }).toList();
      print('🔍 After file type filter: ${_filteredDocuments.length} documents');
    }

    print('🔍 Final filtered documents: ${_filteredDocuments.length}');
    notifyListeners();
  }

  // Helper methods
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

  void clearData() {
    _documents.clear();
    _filteredDocuments.clear();
    _selectedDocument = null;
    _searchQuery = '';
    _categoryFilter = null;
    _fileTypeFilter = null;
    _employeeId = null;
    _currentPage = 1;
    _hasMoreData = true;
    _error = null;
    notifyListeners();
  }
}
