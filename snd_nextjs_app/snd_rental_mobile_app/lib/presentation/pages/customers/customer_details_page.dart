import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/customer_provider.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;
import 'add_customer_page.dart';

class CustomerDetailsPage extends StatefulWidget {
  final String customerId;

  const CustomerDetailsPage({
    super.key,
    required this.customerId,
  });

  @override
  State<CustomerDetailsPage> createState() => _CustomerDetailsPageState();
}

class _CustomerDetailsPageState extends State<CustomerDetailsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CustomerProvider>().loadCustomerById(widget.customerId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Details'),
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              final customer = context.read<CustomerProvider>().selectedCustomer;
              if (customer != null) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => AddCustomerPage(customer: customer),
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: Consumer<CustomerProvider>(
        builder: (context, customerProvider, child) {
          if (customerProvider.isLoading) {
            return const LoadingWidget();
          }

          if (customerProvider.error != null) {
            return custom.ErrorWidget(
              message: customerProvider.error!,
              onRetry: () {
                customerProvider.clearError();
                customerProvider.loadCustomerById(widget.customerId);
              },
            );
          }

          final customer = customerProvider.selectedCustomer;
          if (customer == null) {
            return const Center(
              child: Text('Customer not found'),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Customer Header Card
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        // Avatar and Basic Info
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 40,
                              backgroundColor: _getStatusColor(customer.status).withOpacity(0.2),
                              child: Text(
                                customer.name.isNotEmpty ? customer.name[0].toUpperCase() : 'C',
                                style: TextStyle(
                                  color: _getStatusColor(customer.status),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 32,
                                ),
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    customer.name,
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    customer.email,
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: _getStatusColor(customer.status).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: _getStatusColor(customer.status).withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      customer.status.toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: _getStatusColor(customer.status),
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

                const SizedBox(height: 20),

                // Contact Information
                _buildSectionCard(
                  'Contact Information',
                  Icons.contact_phone,
                  [
                    _buildInfoRow('Email', customer.email, Icons.email),
                    if (customer.phone != null)
                      _buildInfoRow('Phone', customer.phone!, Icons.phone),
                    if (customer.company != null)
                      _buildInfoRow('Company', customer.company!, Icons.business),
                    if (customer.contactPerson != null)
                      _buildInfoRow('Contact Person', customer.contactPerson!, Icons.person),
                  ],
                ),

                const SizedBox(height: 16),

                // Address Information
                if (customer.address != null || customer.city != null || customer.state != null)
                  _buildSectionCard(
                    'Address Information',
                    Icons.location_on,
                    [
                      if (customer.address != null)
                        _buildInfoRow('Address', customer.address!, Icons.home),
                      if (customer.city != null)
                        _buildInfoRow('City', customer.city!, Icons.location_city),
                      if (customer.state != null)
                        _buildInfoRow('State', customer.state!, Icons.map),
                      if (customer.country != null)
                        _buildInfoRow('Country', customer.country!, Icons.public),
                      if (customer.postalCode != null)
                        _buildInfoRow('Postal Code', customer.postalCode!, Icons.local_post_office),
                    ],
                  ),

                const SizedBox(height: 16),

                // Financial Information
                if (customer.creditLimit != null)
                  _buildSectionCard(
                    'Financial Information',
                    Icons.account_balance_wallet,
                    [
                      _buildInfoRow(
                        'Credit Limit',
                        '${customer.creditLimit!.toStringAsFixed(0)} SAR',
                        Icons.monetization_on,
                      ),
                    ],
                  ),

                const SizedBox(height: 16),

                // Additional Information
                if (customer.notes != null)
                  _buildSectionCard(
                    'Additional Information',
                    Icons.note,
                    [
                      _buildInfoRow('Notes', customer.notes!, Icons.description),
                    ],
                  ),

                const SizedBox(height: 16),

                // Timestamps
                _buildSectionCard(
                  'Account Information',
                  Icons.access_time,
                  [
                    _buildInfoRow(
                      'Created',
                      _formatDate(customer.createdAt),
                      Icons.add_circle,
                    ),
                    _buildInfoRow(
                      'Last Updated',
                      _formatDate(customer.updatedAt),
                      Icons.update,
                    ),
                  ],
                ),

                const SizedBox(height: 20),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => AddCustomerPage(customer: customer),
                            ),
                          );
                        },
                        icon: const Icon(Icons.edit),
                        label: const Text('Edit Customer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _showDeleteDialog(context, customer);
                        },
                        icon: const Icon(Icons.delete),
                        label: const Text('Delete'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red.shade600,
                          side: BorderSide(color: Colors.red.shade600),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionCard(String title, IconData icon, List<Widget> children) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.blue.shade600, size: 20),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue.shade600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Colors.green;
      case 'inactive':
        return Colors.orange;
      case 'pending':
        return Colors.blue;
      case 'suspended':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} at ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
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
                Navigator.of(context).pop(); // Go back to list
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
