import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/rental_provider.dart';
import '../../widgets/rental_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;

class RentalListPage extends StatefulWidget {
  const RentalListPage({super.key});

  @override
  State<RentalListPage> createState() => _RentalListPageState();
}

class _RentalListPageState extends State<RentalListPage> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RentalProvider>().loadRentals();
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
      context.read<RentalProvider>().loadMoreRentals();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rentals'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<RentalProvider>().refreshRentals();
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to add rental page
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Add rental feature coming soon')),
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
                    hintText: 'Search rentals...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              context.read<RentalProvider>().searchRentals('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onChanged: (value) {
                    context.read<RentalProvider>().searchRentals(value);
                  },
                ),
                const SizedBox(height: 12),
                
                // Filter Chips
                Consumer<RentalProvider>(
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
                            label: const Text('Pending'),
                            selected: provider.statusFilter == 'pending',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'pending' : null);
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
                            label: const Text('Completed'),
                            selected: provider.statusFilter == 'completed',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'completed' : null);
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
          
          // Rental List
          Expanded(
            child: Consumer<RentalProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.rentals.isEmpty) {
                  return const LoadingWidget();
                }

                if (provider.error != null && provider.rentals.isEmpty) {
                  return custom.ErrorWidget(
                    message: provider.error!,
                    onRetry: () {
                      provider.refreshRentals();
                    },
                  );
                }

                if (provider.rentals.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No rentals found',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Create your first rental agreement to get started',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    provider.refreshRentals();
                  },
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: provider.rentals.length + (provider.hasMoreData ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= provider.rentals.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }

                      final rental = provider.rentals[index];
                      return RentalCard(
                        rental: rental,
                        onTap: () {
                          // TODO: Navigate to rental details
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Rental details: ${rental.rentalNumber}')),
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
