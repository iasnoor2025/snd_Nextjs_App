import 'package:flutter/foundation.dart';
import '../../data/models/company_model.dart';
import '../../data/repositories/company_repository_impl.dart';

class CompanyProvider extends ChangeNotifier {
  final CompanyRepositoryImpl _repository = CompanyRepositoryImpl();
  
  CompanyModel? _company;
  List<Map<String, dynamic>> _documentTypes = [];
  List<Map<String, dynamic>> _documents = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  CompanyModel? get company => _company;
  List<Map<String, dynamic>> get documentTypes => _documentTypes;
  List<Map<String, dynamic>> get documents => _documents;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> loadCompany() async {
    _setLoading(true);
    _clearError();

    try {
      _company = await _repository.getCompany();
    } catch (e) {
      _setError('Failed to load company: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateCompany(int id, CompanyModel company) async {
    _setLoading(true);
    _clearError();

    try {
      _company = await _repository.updateCompany(id, company);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to update company: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadDocumentTypes() async {
    _setLoading(true);
    _clearError();

    try {
      _documentTypes = await _repository.getDocumentTypes();
    } catch (e) {
      _setError('Failed to load document types: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> createDocumentType(Map<String, dynamic> documentType) async {
    _setLoading(true);
    _clearError();

    try {
      final newDocumentType = await _repository.createDocumentType(documentType);
      _documentTypes.add(newDocumentType);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create document type: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadDocuments() async {
    _setLoading(true);
    _clearError();

    try {
      _documents = await _repository.getCompanyDocuments();
    } catch (e) {
      _setError('Failed to load documents: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> uploadDocument(String filePath, Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();

    try {
      final newDocument = await _repository.uploadCompanyDocument(filePath, data);
      _documents.add(newDocument);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to upload document: ${e.toString()}');
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
    _errorMessage = error;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }

  bool get hasError => _errorMessage != null;
}
