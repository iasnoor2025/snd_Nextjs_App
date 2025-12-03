import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/employee_provider.dart';
import '../../widgets/employee_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;
import '../../widgets/ui/input.dart';
import '../../../core/theme/app_theme.dart';
import 'add_employee_page.dart';
import 'employee_details_page.dart';

class EmployeeListPage extends StatefulWidget {
  const EmployeeListPage({super.key});

  @override
  State<EmployeeListPage> createState() => _EmployeeListPageState();
}

class _EmployeeListPageState extends State<EmployeeListPage>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late AnimationController _fabAnimationController;
  late Animation<double> _fabAnimation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EmployeeProvider>().loadAllEmployees();
    });
    
    _scrollController.addListener(_onScroll);
    
    // FAB Animation
    _fabAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fabAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fabAnimationController, curve: Curves.easeOutBack),
    );
    
    _fabAnimationController.forward();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _fabAnimationController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<EmployeeProvider>().loadMoreEmployees();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // Enhanced App Bar
          SliverAppBar(
            expandedHeight: 100,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            toolbarHeight: 56,
            actions: [
              Container(
                margin: const EdgeInsets.only(right: 8, top: 4),
                child: Consumer<EmployeeProvider>(
                  builder: (context, provider, child) {
                    return IconButton(
                      icon: const Icon(Icons.refresh),
                      onPressed: () => provider.loadAllEmployees(),
                      tooltip: 'Refresh employees',
                    );
                  },
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Employee Directory',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              titlePadding: const EdgeInsets.only(left: 16, bottom: 12),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppTheme.primary,
                      AppTheme.primary.withValues(alpha:0.8),
                    ],
                  ),
                ),
                child: Stack(
                  children: [
                    // Background Pattern
                    Positioned(
                      right: -50,
                      top: -50,
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha:0.1),
                        ),
                      ),
                    ),
                    Positioned(
                      left: -30,
                      bottom: -30,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha:0.05),
                        ),
                      ),
                    ),
                    // Employee Count Badge
                    Positioned(
                      top: 12,
                      right: 60,
                      child: Consumer<EmployeeProvider>(
                        builder: (context, provider, child) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha:0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.white.withValues(alpha:0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.people_outline,
                                  size: 16,
                                  color: Colors.white,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${provider.employees.length} Employees',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Search and Filter Section
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha:0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Search Bar
                  Input(
                    controller: _searchController,
                    hint: 'Search employees by name, file number, or ID...',
                    prefixIcon: Container(
                      margin: const EdgeInsets.all(12),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.search,
                        color: AppTheme.primary,
                        size: 20,
                      ),
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              Icons.clear,
                              color: AppTheme.mutedForeground,
                            ),
                            onPressed: () {
                              _searchController.clear();
                              context.read<EmployeeProvider>().searchEmployees('');
                            },
                          )
                        : null,
                    onChanged: (value) {
                      context.read<EmployeeProvider>().searchEmployees(value);
                    },
                  ),
                  const SizedBox(height: 16),
                  
                  // Filter Chips
                  Consumer<EmployeeProvider>(
                    builder: (context, provider, child) {
                      return SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildFilterChip(
                              'All',
                              provider.statusFilter == null,
                              () => provider.setStatusFilter(null),
                              AppTheme.primary,
                            ),
                            const SizedBox(width: 8),
                            _buildFilterChip(
                              'Active',
                              provider.statusFilter == 'active',
                              () => provider.setStatusFilter('active'),
                              AppTheme.success,
                            ),
                            const SizedBox(width: 8),
                            _buildFilterChip(
                              'Terminated',
                              provider.statusFilter == 'terminated',
                              () => provider.setStatusFilter('terminated'),
                              AppTheme.destructive,
                            ),
                            const SizedBox(width: 8),
                            _buildFilterChip(
                              'On Leave',
                              provider.statusFilter == 'on_leave',
                              () => provider.setStatusFilter('on_leave'),
                              AppTheme.warning,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          
          // Employee List
          Consumer<EmployeeProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading && provider.employees.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(50),
                    child: LoadingWidget(),
                  ),
                );
              }

              if (provider.hasError) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: custom.ErrorWidget(
                      message: provider.errorMessage ?? 'Unknown error',
                      onRetry: () => provider.loadAllEmployees(),
                    ),
                  ),
                );
              }

              if (provider.filteredEmployees.isEmpty) {
                return const SliverToBoxAdapter( 
                  child: Padding(
                    padding: EdgeInsets.all(50),
                    child: Column(
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: AppTheme.mutedForeground,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No employees found',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Try adjusting your search or filters',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index >= provider.filteredEmployees.length) {
                        return provider.isLoading
                            ? const Padding(
                                padding: EdgeInsets.all(20),
                                child: LoadingWidget(),
                              )
                            : const SizedBox.shrink();
                      }

                      final employee = provider.filteredEmployees[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: EmployeeCard(
                          employee: employee,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => EmployeeDetailsPage(
                                  employee: employee,
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    },
                    childCount: provider.filteredEmployees.length + 1,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      floatingActionButton: AnimatedBuilder(
        animation: _fabAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _fabAnimation.value,
            child: FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const AddEmployeePage(),
                  ),
                );
              },
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.person_add),
              label: const Text('Add Employee'),
              elevation: 8,
            ),
          );
        },
      ),
    );
  }

  Widget _buildFilterChip(
    String label,
    bool isSelected,
    VoidCallback onTap,
    Color color,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : AppTheme.border,
            width: 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withValues(alpha:0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isSelected) ...[
              const Icon(
                Icons.check,
                size: 16,
                color: Colors.white,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppTheme.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
