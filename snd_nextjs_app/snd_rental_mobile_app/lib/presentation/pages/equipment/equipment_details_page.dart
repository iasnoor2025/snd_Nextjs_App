import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/equipment_provider.dart';
import '../../../data/models/equipment_model.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../../core/theme/app_theme.dart';

class EquipmentDetailsPage extends StatefulWidget {
  final String equipmentId;

  const EquipmentDetailsPage({
    super.key,
    required this.equipmentId,
  });

  @override
  State<EquipmentDetailsPage> createState() => _EquipmentDetailsPageState();
}

class _EquipmentDetailsPageState extends State<EquipmentDetailsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  EquipmentModel? _equipment;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadEquipmentDetails();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadEquipmentDetails() async {
    final provider = context.read<EquipmentProvider>();
    print('🔍 Loading equipment details for ID: ${widget.equipmentId}');
    await provider.getEquipmentById(widget.equipmentId);
    print('📋 Equipment loaded: ${provider.selectedEquipment?.name}');
    print('❌ Error: ${provider.error}');
    setState(() {
      _equipment = provider.selectedEquipment;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_equipment?.displayName ?? 'Equipment Details'),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // TODO: Navigate to edit equipment page
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Edit equipment feature coming soon')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              // TODO: Share equipment details
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Share feature coming soon')),
              );
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.info), text: 'Details'),
            Tab(icon: Icon(Icons.assignment), text: 'Assignments'),
            Tab(icon: Icon(Icons.build), text: 'Maintenance'),
            Tab(icon: Icon(Icons.history), text: 'History'),
          ],
        ),
      ),
      body: Consumer<EquipmentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading equipment details',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.red[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    provider.error!,
                    style: TextStyle(color: Colors.red[600]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadEquipmentDetails,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          final equipment = provider.selectedEquipment;
          if (equipment == null) {
            return const Center(
              child: Text('Equipment not found'),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildDetailsTab(equipment),
              _buildAssignmentsTab(equipment),
              _buildMaintenanceTab(equipment),
              _buildHistoryTab(equipment),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Quick action based on equipment status
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Quick action feature coming soon')),
          );
        },
        icon: const Icon(Icons.add),
        label: Text(_getQuickActionLabel(_equipment?.status)),
      ),
    );
  }

  Widget _buildDetailsTab(EquipmentModel equipment) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Equipment Header Card
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Equipment Image
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.build,
                          size: 40,
                          color: Colors.grey[400],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              equipment.displayName,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (equipment.serialNumber != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Serial: ${equipment.serialNumber}',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: _getStatusColor(equipment.status),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Text(
                                (equipment.status ?? 'UNKNOWN').toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Basic Information Card
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Basic Information',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow('Name', equipment.name),
                  if (equipment.description != null)
                    _buildInfoRow('Description', equipment.description!),
                  if (equipment.status != null)
                    _buildInfoRow('Status', equipment.status!),
                  if (equipment.categoryId != null)
                    _buildInfoRow('Category ID', equipment.categoryId!),
                  if (equipment.manufacturer != null)
                    _buildInfoRow('Manufacturer', equipment.manufacturer!),
                  if (equipment.modelNumber != null)
                    _buildInfoRow('Model Number', equipment.modelNumber!),
                  if (equipment.serialNumber != null)
                    _buildInfoRow('Serial Number', equipment.serialNumber!),
                  if (equipment.chassisNumber != null)
                    _buildInfoRow('Chassis Number', equipment.chassisNumber!),
                  if (equipment.doorNumber != null)
                    _buildInfoRow('Door Number', equipment.doorNumber!),
                  if (equipment.erpnextId != null)
                    _buildInfoRow('ERPNext ID', equipment.erpnextId!),
                  _buildInfoRow('Assigned To', equipment.displayAssignedTo),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Rental Rates Card
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Rental Rates',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (equipment.dailyRate != null)
                    _buildInfoRow('Daily Rate', equipment.dailyRate!),
                  if (equipment.weeklyRate != null)
                    _buildInfoRow('Weekly Rate', equipment.weeklyRate!),
                  if (equipment.monthlyRate != null)
                    _buildInfoRow('Monthly Rate', equipment.monthlyRate!),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Documentation Card
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Documentation',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (equipment.istimara != null)
                    _buildInfoRow('Istimara', equipment.istimara!),
                  if (equipment.istimaraExpiryDate != null)
                    _buildInfoRow('Istimara Expiry Date', equipment.istimaraExpiryDate!),
                  if (equipment.insurance != null)
                    _buildInfoRow('Insurance', equipment.insurance!),
                  if (equipment.insuranceExpiryDate != null)
                    _buildInfoRow('Insurance Expiry Date', equipment.insuranceExpiryDate!),
                  if (equipment.tuvCard != null)
                    _buildInfoRow('TUV Card', equipment.tuvCard!),
                  if (equipment.tuvCardExpiryDate != null)
                    _buildInfoRow('TUV Card Expiry Date', equipment.tuvCardExpiryDate!),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),


          const SizedBox(height: 80), // Space for floating action button
        ],
      ),
    );
  }

  Widget _buildAssignmentsTab(EquipmentModel equipment) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Current Assignment',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          // Current Assignment Status
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        equipment.isAssigned ? Icons.assignment_ind : Icons.assignment_outlined,
                        color: equipment.isAssigned ? Colors.green : Colors.orange,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        equipment.isAssigned ? 'Currently Assigned' : 'Available for Assignment',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: equipment.isAssigned ? Colors.green[700] : Colors.orange[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (equipment.isAssigned) ...[
                    _buildInfoRow('Assigned To Employee ID', equipment.assignedTo!),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _unassignEquipment(equipment),
                            icon: const Icon(Icons.remove_circle_outline),
                            label: const Text('Unassign'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    Text(
                      'This equipment is available for assignment to employees.',
                      style: TextStyle(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => _showAssignDialog(equipment),
                      icon: const Icon(Icons.add_circle_outline),
                      label: const Text('Assign to Employee'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Icon(
                    Icons.history,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Assignment History Coming Soon',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'View past assignments and rental history for this equipment.',
                    style: TextStyle(color: Colors.grey[500]),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMaintenanceTab(EquipmentModel equipment) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Maintenance Status',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.build_circle,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Maintenance Data Not Available',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Maintenance information is not included in the current API response.',
                    style: TextStyle(
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          const Text(
            'Maintenance History',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Icon(
                    Icons.build_circle_outlined,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Maintenance History Coming Soon',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'View past maintenance records and scheduled maintenance for this equipment.',
                    style: TextStyle(color: Colors.grey[500]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: () {
                      // TODO: Schedule maintenance
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Schedule maintenance feature coming soon')),
                      );
                    },
                    icon: const Icon(Icons.add_circle_outline),
                    label: const Text('Schedule Maintenance'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTab(EquipmentModel equipment) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Equipment History',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Icon(
                    Icons.timeline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'History Tracking Coming Soon',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'View complete history including assignments, maintenance, rentals, and status changes.',
                    style: TextStyle(color: Colors.grey[500]),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          const Text(
            'Recent Activity',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ui.UICard(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Icon(
                    Icons.update,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Activity Log Coming Soon',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Track all changes and activities related to this equipment.',
                    style: TextStyle(color: Colors.grey[500]),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
            ),
          ),
          const Text(': '),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w400),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'available':
        return Colors.green;
      case 'in_use':
      case 'assigned':
        return Colors.blue;
      case 'maintenance':
        return Colors.orange;
      case 'retired':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getQuickActionLabel(String? status) {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'Assign';
      case 'in_use':
      case 'assigned':
        return 'Return';
      case 'maintenance':
        return 'Complete';
      default:
        return 'Action';
    }
  }

  void _showAssignDialog(EquipmentModel equipment) {
    final employeeIdController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Assign Equipment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Assign ${equipment.name} to an employee'),
            const SizedBox(height: 16),
            TextField(
              controller: employeeIdController,
              decoration: const InputDecoration(
                labelText: 'Employee ID',
                hintText: 'Enter employee ID',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (employeeIdController.text.isNotEmpty) {
                _assignEquipment(equipment, employeeIdController.text);
                Navigator.of(context).pop();
              }
            },
            child: const Text('Assign'),
          ),
        ],
      ),
    );
  }

  void _assignEquipment(EquipmentModel equipment, String employeeId) async {
    try {
      final provider = context.read<EquipmentProvider>();
      // TODO: Implement assignment API call
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Assigning ${equipment.name} to employee $employeeId...'),
          backgroundColor: Colors.blue,
        ),
      );
      
      // For now, just show a success message
      await Future.delayed(const Duration(seconds: 1));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${equipment.name} assigned to employee $employeeId'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Refresh equipment details
      provider.getEquipmentById(equipment.id);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to assign equipment: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _unassignEquipment(EquipmentModel equipment) async {
    try {
      final provider = context.read<EquipmentProvider>();
      // TODO: Implement unassignment API call
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unassigning ${equipment.name}...'),
          backgroundColor: Colors.orange,
        ),
      );
      
      // For now, just show a success message
      await Future.delayed(const Duration(seconds: 1));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${equipment.name} unassigned successfully'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Refresh equipment details
      provider.getEquipmentById(equipment.id);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to unassign equipment: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
