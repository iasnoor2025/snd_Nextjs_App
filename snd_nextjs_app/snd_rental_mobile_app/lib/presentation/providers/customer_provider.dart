import 'package:flutter/foundation.dart';
import '../../data/models/customer_model.dart';
import '../../data/repositories/customer_repository_impl.dart';
import '../../core/errors/api_exception.dart';

class CustomerProvider extends ChangeNotifier {
  final CustomerRepositoryImpl _repository = CustomerRepositoryImpl();

  List<CustomerModel> _customers = [];
  CustomerModel? _selectedCustomer;
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String _statusFilter = 'all';
  int _currentPage = 1;
  bool _hasMore = true;

  // Getters
  List<CustomerModel> get customers => _customers;
  CustomerModel? get selectedCustomer => _selectedCustomer;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get searchQuery => _searchQuery;
  String get statusFilter => _statusFilter;
  int get currentPage => _currentPage;
  bool get hasMore => _hasMore;

  // Computed getters
  List<CustomerModel> get filteredCustomers {
    List<CustomerModel> filtered = _customers;

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((customer) {
        return customer.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
               customer.email.toLowerCase().contains(_searchQuery.toLowerCase()) ||
               (customer.company?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
      }).toList();
    }

    // Apply status filter
    if (_statusFilter != 'all') {
      filtered = filtered.where((customer) => customer.status == _statusFilter).toList();
    }

    return filtered;
  }

  List<CustomerModel> get activeCustomers =>
      _customers.where((customer) => customer.status == 'active').toList();

  List<CustomerModel> get inactiveCustomers =>
      _customers.where((customer) => customer.status == 'inactive').toList();

  int get totalCustomers => _customers.length;
  int get activeCustomersCount => activeCustomers.length;
  int get inactiveCustomersCount => inactiveCustomers.length;

  // Methods
  Future<void> loadCustomers({bool refresh = false}) async {
    if (_isLoading) return;

    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _customers.clear();
    }

    if (!_hasMore) return;

    _setLoading(true);
    _clearError();

    try {
      final newCustomers = await _repository.getCustomers(
        page: _currentPage,
        limit: 20,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter != 'all' ? _statusFilter : null,
      );

      if (refresh) {
        _customers = newCustomers;
      } else {
        _customers.addAll(newCustomers);
      }

      _hasMore = newCustomers.length == 20;
      _currentPage++;

      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loadCustomerById(String id) async {
    _setLoading(true);
    _clearError();

    try {
      _selectedCustomer = await _repository.getCustomerById(id);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> createCustomer(CustomerModel customer) async {
    _setLoading(true);
    _clearError();

    try {
      final newCustomer = await _repository.createCustomer(customer);
      _customers.insert(0, newCustomer);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateCustomer(String id, CustomerModel customer) async {
    _setLoading(true);
    _clearError();

    try {
      final updatedCustomer = await _repository.updateCustomer(id, customer);
      
      final index = _customers.indexWhere((c) => c.id == id);
      if (index != -1) {
        _customers[index] = updatedCustomer;
      }

      if (_selectedCustomer?.id == id) {
        _selectedCustomer = updatedCustomer;
      }

      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  Future<void> deleteCustomer(String id) async {
    _setLoading(true);
    _clearError();

    try {
      await _repository.deleteCustomer(id);
      _customers.removeWhere((customer) => customer.id == id);
      
      if (_selectedCustomer?.id == id) {
        _selectedCustomer = null;
      }

      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setStatusFilter(String status) {
    _statusFilter = status;
    notifyListeners();
  }

  void clearFilters() {
    _searchQuery = '';
    _statusFilter = 'all';
    notifyListeners();
  }

  void selectCustomer(CustomerModel? customer) {
    _selectedCustomer = customer;
    notifyListeners();
  }

  void clearError() {
    _clearError();
  }

  // Private methods
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
    notifyListeners();
  }

  // Demo data for testing
  Future<void> loadDemoCustomers() async {
    _setLoading(true);
    _clearError();

    try {
      // Simulate API delay
      await Future.delayed(const Duration(seconds: 1));

      _customers = [
        CustomerModel(
          id: '1',
          name: 'Ahmed Al-Rashid',
          email: 'ahmed@alrashid.com',
          phone: '+966501234567',
          address: 'King Fahd Road, Riyadh',
          city: 'Riyadh',
          state: 'Riyadh',
          country: 'Saudi Arabia',
          postalCode: '12345',
          company: 'Al-Rashid Construction',
          contactPerson: 'Ahmed Al-Rashid',
          creditLimit: 500000.0,
          status: 'active',
          notes: 'Major construction client',
          createdAt: DateTime.now().subtract(const Duration(days: 30)),
          updatedAt: DateTime.now().subtract(const Duration(days: 5)),
        ),
        CustomerModel(
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@techsolutions.com',
          phone: '+966502345678',
          address: 'Prince Mohammed Street, Jeddah',
          city: 'Jeddah',
          state: 'Makkah',
          country: 'Saudi Arabia',
          postalCode: '21432',
          company: 'Tech Solutions Ltd',
          contactPerson: 'Sarah Johnson',
          creditLimit: 250000.0,
          status: 'active',
          notes: 'Technology consulting firm',
          createdAt: DateTime.now().subtract(const Duration(days: 45)),
          updatedAt: DateTime.now().subtract(const Duration(days: 10)),
        ),
        CustomerModel(
          id: '3',
          name: 'Mohammed Al-Zahra',
          email: 'mohammed@zahra.com',
          phone: '+966503456789',
          address: 'Al-Khobar Corniche',
          city: 'Al-Khobar',
          state: 'Eastern Province',
          country: 'Saudi Arabia',
          postalCode: '31952',
          company: 'Zahra Trading Co.',
          contactPerson: 'Mohammed Al-Zahra',
          creditLimit: 100000.0,
          status: 'inactive',
          notes: 'Trading company - on hold',
          createdAt: DateTime.now().subtract(const Duration(days: 60)),
          updatedAt: DateTime.now().subtract(const Duration(days: 20)),
        ),
        CustomerModel(
          id: '4',
          name: 'Fatima Al-Mansouri',
          email: 'fatima@mansouri.com',
          phone: '+966504567890',
          address: 'Al-Faisaliah District, Riyadh',
          city: 'Riyadh',
          state: 'Riyadh',
          country: 'Saudi Arabia',
          postalCode: '11564',
          company: 'Mansouri Group',
          contactPerson: 'Fatima Al-Mansouri',
          creditLimit: 750000.0,
          status: 'active',
          notes: 'Large corporate client',
          createdAt: DateTime.now().subtract(const Duration(days: 15)),
          updatedAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
        CustomerModel(
          id: '5',
          name: 'Omar Hassan',
          email: 'omar@hassan.com',
          phone: '+966505678901',
          address: 'Al-Hamra District, Dammam',
          city: 'Dammam',
          state: 'Eastern Province',
          country: 'Saudi Arabia',
          postalCode: '31421',
          company: 'Hassan Engineering',
          contactPerson: 'Omar Hassan',
          creditLimit: 300000.0,
          status: 'active',
          notes: 'Engineering consultancy',
          createdAt: DateTime.now().subtract(const Duration(days: 25)),
          updatedAt: DateTime.now().subtract(const Duration(days: 7)),
        ),
      ];

      notifyListeners();
    } catch (e) {
      _setError(e.toString());
    } finally {
      _setLoading(false);
    }
  }
}
