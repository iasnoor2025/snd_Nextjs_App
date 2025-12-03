import 'package:flutter/foundation.dart';
import '../../data/models/quotation_model.dart';
import '../../data/repositories/quotation_repository_impl.dart';

class QuotationProvider extends ChangeNotifier {
  final QuotationRepositoryImpl _repository = QuotationRepositoryImpl();
  
  List<QuotationModel> _quotations = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _statusFilter;
  int? _customerFilter;

  // Getters
  List<QuotationModel> get quotations => _quotations;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasMore => _hasMore;
  String? get statusFilter => _statusFilter;
  int? get customerFilter => _customerFilter;

  List<QuotationModel> get filteredQuotations {
    if (_statusFilter == null && _customerFilter == null) {
      return _quotations;
    }
    
    return _quotations.where((quotation) {
      bool matches = true;
      
      if (_statusFilter != null && quotation.status != _statusFilter) {
        matches = false;
      }
      
      if (_customerFilter != null && quotation.customerId != _customerFilter) {
        matches = false;
      }
      
      return matches;
    }).toList();
  }

  Map<String, int> getQuotationStats() {
    final stats = <String, int>{
      'total': _quotations.length,
      'draft': _quotations.where((q) => q.status == 'draft').length,
      'sent': _quotations.where((q) => q.status == 'sent').length,
      'approved': _quotations.where((q) => q.status == 'approved').length,
      'rejected': _quotations.where((q) => q.status == 'rejected').length,
      'expired': _quotations.where((q) => q.status == 'expired').length,
    };
    return stats;
  }

  Future<void> loadQuotations({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _quotations.clear();
    }

    if (!_hasMore || _isLoading) return;

    _setLoading(true);
    _clearError();

    try {
      final newQuotations = await _repository.getQuotations(
        page: _currentPage,
        status: _statusFilter,
        customerId: _customerFilter,
      );

      if (newQuotations.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _quotations = newQuotations;
        } else {
          _quotations.addAll(newQuotations);
        }
        _currentPage++;
      }
    } catch (e) {
      _setError('Failed to load quotations: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMoreQuotations() async {
    await loadQuotations();
  }

  Future<void> refreshQuotations() async {
    await loadQuotations(refresh: true);
  }

  Future<QuotationModel?> getQuotationById(int id) async {
    try {
      return await _repository.getQuotationById(id);
    } catch (e) {
      _setError('Failed to load quotation: ${e.toString()}');
      return null;
    }
  }

  Future<bool> createQuotation(QuotationModel quotation) async {
    _setLoading(true);
    _clearError();

    try {
      final newQuotation = await _repository.createQuotation(quotation);
      _quotations.insert(0, newQuotation);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to create quotation: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateQuotation(int id, QuotationModel quotation) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedQuotation = await _repository.updateQuotation(id, quotation);
      final index = _quotations.indexWhere((q) => q.id == id);
      if (index != -1) {
        _quotations[index] = updatedQuotation;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to update quotation: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deleteQuotation(int id) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.deleteQuotation(id);
      _quotations.removeWhere((q) => q.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to delete quotation: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> sendQuotation(int id) async {
    _setLoading(true);
    _clearError();

    try {
      final sentQuotation = await _repository.sendQuotation(id);
      final index = _quotations.indexWhere((q) => q.id == id);
      if (index != -1) {
        _quotations[index] = sentQuotation;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to send quotation: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> approveQuotation(int id) async {
    _setLoading(true);
    _clearError();

    try {
      final approvedQuotation = await _repository.approveQuotation(id);
      final index = _quotations.indexWhere((q) => q.id == id);
      if (index != -1) {
        _quotations[index] = approvedQuotation;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to approve quotation: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> rejectQuotation(int id, String reason) async {
    _setLoading(true);
    _clearError();

    try {
      final rejectedQuotation = await _repository.rejectQuotation(id, reason);
      final index = _quotations.indexWhere((q) => q.id == id);
      if (index != -1) {
        _quotations[index] = rejectedQuotation;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _setError('Failed to reject quotation: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>?> convertToRental(int id) async {
    try {
      return await _repository.convertToRental(id);
    } catch (e) {
      _setError('Failed to convert quotation to rental: ${e.toString()}');
      return null;
    }
  }

  Future<String?> printQuotation(int id) async {
    try {
      return await _repository.printQuotation(id);
    } catch (e) {
      _setError('Failed to print quotation: ${e.toString()}');
      return null;
    }
  }

  void setStatusFilter(String? status) {
    _statusFilter = status;
    notifyListeners();
  }

  void setCustomerFilter(int? customerId) {
    _customerFilter = customerId;
    notifyListeners();
  }

  void clearFilters() {
    _statusFilter = null;
    _customerFilter = null;
    notifyListeners();
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
