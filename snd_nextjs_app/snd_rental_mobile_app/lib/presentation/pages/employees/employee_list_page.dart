import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/employee_provider.dart';
import '../../widgets/employee_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;

class EmployeeListPage extends StatefulWidget {
  const EmployeeListPage({super.key});

  @override
  State<EmployeeListPage> createState() => _EmployeeListPageState();
}

class _EmployeeListPageState extends State<EmployeeListPage> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EmployeeProvider>().loadEmployees();
    });
    
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      context.read<EmployeeProvider>().loadMoreEmployees();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<EmployeeProvider>().refreshEmployees();
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to add employee page
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Add employee feature coming soon')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search employees...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              context.read<EmployeeProvider>().searchEmployees('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onChanged: (value) {
                    context.read<EmployeeProvider>().searchEmployees(value);
                  },
                ),
                const SizedBox(height: 12),
                
                // Filter Chips
                Consumer<EmployeeProvider>(
                  builder: (context, provider, child) {
                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          FilterChip(
                            label: const Text('All'),
                            selected: provider.statusFilter == null,
                            onSelected: (selected) {
                              if (selected) {
                                provider.filterByStatus(null);
                              }
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Active'),
                            selected: provider.statusFilter == 'active',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'active' : null);
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Terminated'),
                            selected: provider.statusFilter == 'terminated',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'terminated' : null);
                            },
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          
          // Employee List
          Expanded(
            child: Consumer<EmployeeProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.employees.isEmpty) {
                  return const LoadingWidget();
                }

                if (provider.error != null && provider.employees.isEmpty) {
                  return custom.ErrorWidget(
                    message: provider.error!,
                    onRetry: () {
                      provider.refreshEmployees();
                    },
                  );
                }

                if (provider.employees.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.people_outline, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No employees found',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Add your first employee to get started',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    provider.refreshEmployees();
                  },
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: provider.employees.length + (provider.hasMoreData ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= provider.employees.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }

                      final employee = provider.employees[index];
                      return EmployeeCard(
                        employee: employee,
                        onTap: () {
                          // TODO: Navigate to employee details
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Employee details: ${employee.displayName}')),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
