import 'package:flutter/foundation.dart';
import '../../data/models/report_model.dart';
import '../../data/repositories/report_repository_impl.dart';

class ReportProvider extends ChangeNotifier {
  final ReportRepositoryImpl _repository = ReportRepositoryImpl();
  
  List<ReportModel> _reports = [];
  Map<String, dynamic> _analyticsOverview = {};
  Map<String, dynamic> _employeeAnalytics = {};
  Map<String, dynamic> _projectAnalytics = {};
  Map<String, dynamic> _equipmentAnalytics = {};
  Map<String, dynamic> _financialReports = {};
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMore = true;
  String? _typeFilter;
  String? _statusFilter;

  // Getters
  List<ReportModel> get reports => _reports;
  Map<String, dynamic> get analyticsOverview => _analyticsOverview;
  Map<String, dynamic> get employeeAnalytics => _employeeAnalytics;
  Map<String, dynamic> get projectAnalytics => _projectAnalytics;
  Map<String, dynamic> get equipmentAnalytics => _equipmentAnalytics;
  Map<String, dynamic> get financialReports => _financialReports;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasMore => _hasMore;
  String? get typeFilter => _typeFilter;
  String? get statusFilter => _statusFilter;

  List<ReportModel> get filteredReports {
    if (_typeFilter == null && _statusFilter == null) {
      return _reports;
    }
    
    return _reports.where((report) {
      bool matches = true;
      
      if (_typeFilter != null && report.type != _typeFilter) {
        matches = false;
      }
      
      if (_statusFilter != null && report.status != _statusFilter) {
        matches = false;
      }
      
      return matches;
    }).toList();
  }

  Map<String, int> getReportStats() {
    final stats = <String, int>{
      'total': _reports.length,
      'pending': _reports.where((r) => r.status == 'pending').length,
      'generating': _reports.where((r) => r.status == 'generating').length,
      'completed': _reports.where((r) => r.status == 'completed').length,
      'failed': _reports.where((r) => r.status == 'failed').length,
    };
    return stats;
  }

  Future<void> loadReports({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _reports.clear();
    }

    if (!_hasMore || _isLoading) return;

    _setLoading(true);
    _clearError();

    try {
      final newReports = await _repository.getReports(
        page: _currentPage,
        type: _typeFilter,
        status: _statusFilter,
      );

      if (newReports.isEmpty) {
        _hasMore = false;
      } else {
        if (refresh) {
          _reports = newReports;
        } else {
          _reports.addAll(newReports);
        }
        _currentPage++;
      }
    } catch (e) {
      _setError('Failed to load reports: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadMoreReports() async {
    await loadReports();
  }

  Future<void> refreshReports() async {
    await loadReports(refresh: true);
  }

  Future<ReportModel?> getReportById(int id) async {
    try {
      return await _repository.getReportById(id);
    } catch (e) {
      _setError('Failed to load report: ${e.toString()}');
      return null;
    }
  }

  Future<bool> generateReport(Map<String, dynamic> reportData) async {
    _setLoading(true);
    _clearError();

    try {
      final newReport = await _repository.generateReport(reportData);
      _reports.insert(0, newReport);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to generate report: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> deleteReport(int id) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.deleteReport(id);
      _reports.removeWhere((r) => r.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Failed to delete report: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadAnalyticsOverview() async {
    _setLoading(true);
    _clearError();

    try {
      _analyticsOverview = await _repository.getAnalyticsOverview();
    } catch (e) {
      _setError('Failed to load analytics overview: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadEmployeeAnalytics() async {
    _setLoading(true);
    _clearError();

    try {
      _employeeAnalytics = await _repository.getEmployeeAnalytics();
    } catch (e) {
      _setError('Failed to load employee analytics: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadProjectAnalytics() async {
    _setLoading(true);
    _clearError();

    try {
      _projectAnalytics = await _repository.getProjectAnalytics();
    } catch (e) {
      _setError('Failed to load project analytics: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadEquipmentAnalytics() async {
    _setLoading(true);
    _clearError();

    try {
      _equipmentAnalytics = await _repository.getEquipmentAnalytics();
    } catch (e) {
      _setError('Failed to load equipment analytics: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadFinancialReports() async {
    _setLoading(true);
    _clearError();

    try {
      _financialReports = await _repository.getFinancialReports();
    } catch (e) {
      _setError('Failed to load financial reports: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  void setTypeFilter(String? type) {
    _typeFilter = type;
    notifyListeners();
  }

  void setStatusFilter(String? status) {
    _statusFilter = status;
    notifyListeners();
  }

  void clearFilters() {
    _typeFilter = null;
    _statusFilter = null;
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
