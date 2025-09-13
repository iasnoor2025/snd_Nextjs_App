import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../../providers/equipment_provider.dart';
import '../../providers/equipment_document_provider.dart';
import '../../../data/models/equipment_model.dart';
import '../../../data/models/equipment_document_model.dart';
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
    _tabController = TabController(length: 5, vsync: this);
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
            Tab(icon: Icon(Icons.description), text: 'Documents'),
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
              _buildDocumentsTab(equipment),
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

  Widget _buildDocumentsTab(EquipmentModel equipment) {
    return Consumer<EquipmentDocumentProvider>(
      builder: (context, documentProvider, child) {
        return RefreshIndicator(
          onRefresh: () async {
            try {
              await documentProvider.loadDocuments(int.parse(widget.equipmentId));
            } catch (e) {
              print('🔍 Refresh failed: $e');
            }
          },
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with upload button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Equipment Documents',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _showUploadDialog(equipment),
                      icon: const Icon(Icons.upload),
                      label: const Text('Upload'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Documents list
                if (documentProvider.isLoading)
                  const Center(child: CircularProgressIndicator())
                else if (documentProvider.error != null)
                  ui.UICard(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 64,
                            color: Colors.red[300],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Error loading documents',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.red[700],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            documentProvider.error!,
                            style: TextStyle(color: Colors.red[600]),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () async {
                              try {
                                await documentProvider.loadDocuments(int.parse(widget.equipmentId));
                              } catch (e) {
                                print('🔍 Retry failed: $e');
                              }
                            },
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (documentProvider.documents.isEmpty)
                  ui.UICard(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Icon(
                            Icons.description_outlined,
                            size: 64,
                            color: Colors.grey[400],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No Documents Found',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Upload documents for this equipment to get started.',
                            style: TextStyle(color: Colors.grey[500]),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () => _showUploadDialog(equipment),
                            icon: const Icon(Icons.upload),
                            label: const Text('Upload First Document'),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  Column(
                    children: documentProvider.documents.map((document) {
                      return _buildDocumentCard(document);
                    }).toList(),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDocumentCard(EquipmentDocumentModel document) {
    return ui.UICard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Document icon
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _getDocumentTypeColor(document.documentType),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getDocumentTypeIcon(document.documentType),
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                // Document info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        document.displayName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${document.displayType} • ${document.displaySize}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                      if (document.description?.isNotEmpty == true) ...[
                        const SizedBox(height: 4),
                        Text(
                          document.displayDescription,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                // Actions
                PopupMenuButton<String>(
                  onSelected: (value) => _handleDocumentAction(value, document),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'view',
                      child: Row(
                        children: [
                          Icon(Icons.visibility),
                          SizedBox(width: 8),
                          Text('View'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'download',
                      child: Row(
                        children: [
                          Icon(Icons.download),
                          SizedBox(width: 8),
                          Text('Download'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Delete', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Document type badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getDocumentTypeColor(document.documentType).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                document.documentType.toUpperCase(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: _getDocumentTypeColor(document.documentType),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showUploadDialog(EquipmentModel equipment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Upload Document'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Upload a document for ${equipment.name}'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => _pickAndUploadFile(equipment),
              icon: const Icon(Icons.file_upload),
              label: const Text('Select File'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _pickAndUploadFile(EquipmentModel equipment) async {
    try {
      Navigator.of(context).pop(); // Close dialog
      
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        if (file.path != null) {
          await _showDocumentTypeDialog(equipment, file.path!, file.name);
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error picking file: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _showDocumentTypeDialog(EquipmentModel equipment, String filePath, String fileName) async {
    final documentTypeController = TextEditingController();
    final descriptionController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Document Details'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('File: $fileName'),
            const SizedBox(height: 16),
            TextField(
              controller: documentTypeController,
              decoration: const InputDecoration(
                labelText: 'Document Type',
                hintText: 'e.g., manual, warranty, certificate',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description (Optional)',
                hintText: 'Brief description of the document',
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (documentTypeController.text.isNotEmpty) {
                Navigator.of(context).pop();
                await _uploadDocument(
                  equipment,
                  filePath,
                  fileName,
                  documentTypeController.text,
                  descriptionController.text.isNotEmpty ? descriptionController.text : null,
                );
              }
            },
            child: const Text('Upload'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadDocument(
    EquipmentModel equipment,
    String filePath,
    String fileName,
    String documentType,
    String? description,
  ) async {
    final documentProvider = context.read<EquipmentDocumentProvider>();
    
    final success = await documentProvider.uploadDocument(
      equipmentId: int.parse(equipment.id),
      filePath: filePath,
      fileName: fileName,
      documentType: documentType,
      description: description,
    );

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Document uploaded successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to upload document: ${documentProvider.error}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _handleDocumentAction(String action, EquipmentDocumentModel document) {
    switch (action) {
      case 'view':
        // TODO: Open document viewer
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document viewer coming soon')),
        );
        break;
      case 'download':
        // TODO: Download document
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Download feature coming soon')),
        );
        break;
      case 'delete':
        _showDeleteConfirmDialog(document);
        break;
    }
  }

  void _showDeleteConfirmDialog(EquipmentDocumentModel document) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Document'),
        content: Text('Are you sure you want to delete "${document.displayName}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _deleteDocument(document);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteDocument(EquipmentDocumentModel document) async {
    final documentProvider = context.read<EquipmentDocumentProvider>();
    
    final success = await documentProvider.deleteDocument(document.id);

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Document deleted successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to delete document: ${documentProvider.error}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  IconData _getDocumentTypeIcon(String documentType) {
    switch (documentType.toLowerCase()) {
      case 'manual':
        return Icons.menu_book;
      case 'warranty':
        return Icons.verified;
      case 'certificate':
      case 'certification':
        return Icons.card_membership;
      case 'insurance':
        return Icons.security;
      case 'invoice':
        return Icons.receipt;
      case 'image':
      case 'photo':
        return Icons.image;
      default:
        return Icons.description;
    }
  }

  Color _getDocumentTypeColor(String documentType) {
    switch (documentType.toLowerCase()) {
      case 'manual':
        return Colors.blue;
      case 'warranty':
        return Colors.green;
      case 'certificate':
      case 'certification':
        return Colors.purple;
      case 'insurance':
        return Colors.orange;
      case 'invoice':
        return Colors.teal;
      case 'image':
      case 'photo':
        return Colors.pink;
      default:
        return Colors.grey;
    }
  }
}
