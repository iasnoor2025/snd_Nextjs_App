import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/customer_provider.dart';
import '../../widgets/customer_card.dart';
import '../../widgets/search_bar_widget.dart';
import '../../widgets/filter_chips_widget.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;
import 'customer_details_page.dart';
import 'add_customer_page.dart';

class CustomerListPage extends StatefulWidget {
  const CustomerListPage({super.key});

  @override
  State<CustomerListPage> createState() => _CustomerListPageState();
}

class _CustomerListPageState extends State<CustomerListPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CustomerProvider>().loadDemoCustomers();
    });
    
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<CustomerProvider>().loadCustomers();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customers'),
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<CustomerProvider>().loadDemoCustomers();
            },
          ),
        ],
      ),
      body: Consumer<CustomerProvider>(
        builder: (context, customerProvider, child) {
          if (customerProvider.isLoading && customerProvider.customers.isEmpty) {
            return const LoadingWidget();
          }

          if (customerProvider.error != null && customerProvider.customers.isEmpty) {
            return custom.ErrorWidget(
              message: customerProvider.error!,
              onRetry: () {
                customerProvider.clearError();
                customerProvider.loadDemoCustomers();
              },
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              customerProvider.loadDemoCustomers();
            },
            child: Column(
              children: [
                // Search and Filter Section
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.grey.shade50,
                  child: Column(
                    children: [
                      // Search Bar
                      SearchBarWidget(
                        hintText: 'Search customers...',
                        onChanged: customerProvider.setSearchQuery,
                        onClear: () => customerProvider.setSearchQuery(''),
                      ),
                      
                      const SizedBox(height: 12),
                      
                      // Filter Chips
                      FilterChipsWidget(
                        options: const ['All', 'Active', 'Inactive'],
                        selectedOptions: customerProvider.statusFilter == 'all' 
                            ? ['All'] 
                            : customerProvider.statusFilter == 'active' 
                                ? ['Active'] 
                                : customerProvider.statusFilter == 'inactive' 
                                    ? ['Inactive'] 
                                    : ['All'],
                        onSelectionChanged: (selected) {
                          if (selected.contains('All')) {
                            customerProvider.setStatusFilter('all');
                          } else if (selected.contains('Active')) {
                            customerProvider.setStatusFilter('active');
                          } else if (selected.contains('Inactive')) {
                            customerProvider.setStatusFilter('inactive');
                          }
                        },
                        label: 'Status Filter',
                      ),
                    ],
                  ),
                ),

                // Customer Stats
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          'Total',
                          customerProvider.totalCustomers.toString(),
                          Colors.blue,
                          Icons.people,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          'Active',
                          customerProvider.activeCustomersCount.toString(),
                          Colors.green,
                          Icons.check_circle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          'Inactive',
                          customerProvider.inactiveCustomersCount.toString(),
                          Colors.orange,
                          Icons.pause_circle,
                        ),
                      ),
                    ],
                  ),
                ),

                // Customer List
                Expanded(
                  child: customerProvider.filteredCustomers.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: customerProvider.filteredCustomers.length + 
                                   (customerProvider.isLoading ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index >= customerProvider.filteredCustomers.length) {
                              return const Padding(
                                padding: EdgeInsets.all(16),
                                child: Center(
                                  child: CircularProgressIndicator(),
                                ),
                              );
                            }

                            final customer = customerProvider.filteredCustomers[index];
                            return CustomerCard(
                              customer: customer,
                              onTap: () {
                                customerProvider.selectCustomer(customer);
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) => CustomerDetailsPage(
                                      customerId: customer.id,
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const AddCustomerPage(),
            ),
          );
        },
        backgroundColor: Colors.blue.shade600,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: color.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.people_outline,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'No customers found',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add your first customer to get started',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const AddCustomerPage(),
                ),
              );
            },
            icon: const Icon(Icons.add),
            label: const Text('Add Customer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue.shade600,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, customer) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Delete Customer'),
          content: Text('Are you sure you want to delete ${customer.name}?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.read<CustomerProvider>().deleteCustomer(customer.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${customer.name} deleted successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );
  }
}
