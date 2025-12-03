import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/equipment_provider.dart';
import '../../widgets/equipment_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;
import '../../widgets/qr_scanner_widget.dart';
import 'equipment_details_page.dart';

class EquipmentListPage extends StatefulWidget {
  const EquipmentListPage({super.key});

  @override
  State<EquipmentListPage> createState() => _EquipmentListPageState();
}

class _EquipmentListPageState extends State<EquipmentListPage> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EquipmentProvider>().loadEquipment();
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
      context.read<EquipmentProvider>().loadMoreEquipment();
    }
  }

  void _scanQRCode() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => QRScannerWidget(
          title: 'Scan Equipment QR Code',
          subtitle: 'Scan the QR code on equipment to view details',
          onScanResult: (code) {
            Navigator.of(context).pop();
            // TODO: Navigate to equipment details or search by QR code
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Scanned QR Code: $code')),
            );
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Equipment'),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: _scanQRCode,
            tooltip: 'Scan QR Code',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<EquipmentProvider>().refreshEquipment();
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to add equipment page
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Add equipment feature coming soon')),
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
                    hintText: 'Search equipment...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              context.read<EquipmentProvider>().searchEquipment('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onChanged: (value) {
                    context.read<EquipmentProvider>().searchEquipment(value);
                  },
                ),
                const SizedBox(height: 12),
                
                // Filter Chips
                Consumer<EquipmentProvider>(
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
                            label: const Text('Available'),
                            selected: provider.statusFilter == 'available',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'available' : null);
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('In Use'),
                            selected: provider.statusFilter == 'in_use',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'in_use' : null);
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Maintenance'),
                            selected: provider.statusFilter == 'maintenance',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'maintenance' : null);
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
          
          // Equipment List
          Expanded(
            child: Consumer<EquipmentProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.equipment.isEmpty) {
                  return const LoadingWidget();
                }

                if (provider.error != null && provider.equipment.isEmpty) {
                  return custom.ErrorWidget(
                    message: provider.error!,
                    onRetry: () {
                      provider.refreshEquipment();
                    },
                  );
                }

                if (provider.equipment.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.build_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No equipment found',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Add your first equipment to get started',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    provider.refreshEquipment();
                  },
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: provider.equipment.length + (provider.hasMoreData ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= provider.equipment.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }

                      final equipment = provider.equipment[index];
                      return EquipmentCard(
                        equipment: equipment,
                        onTap: () {
                          print('🔍 Navigating to equipment details for ID: ${equipment.id}');
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => EquipmentDetailsPage(
                                equipmentId: equipment.id,
                              ),
                            ),
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
