import 'package:flutter/material.dart';
import '../../data/models/equipment_model.dart';

class EquipmentCard extends StatelessWidget {
  final EquipmentModel equipment;
  final VoidCallback? onTap;

  const EquipmentCard({
    super.key,
    required this.equipment,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Equipment Header
              Row(
                children: [
                  // Equipment Image
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.build,
                      size: 30,
                      color: Colors.grey[400],
                    ),
                  ),
                  
                  const SizedBox(width: 12),
                  
                  // Equipment Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          equipment.displayName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (equipment.serialNumber != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'SN: ${equipment.serialNumber}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                        if (equipment.categoryId != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Category: ${equipment.categoryId!}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(equipment.status),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      (equipment.status ?? 'UNKNOWN').toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Equipment Details
              Row(
                children: [
                  // Location - removed as not in API response
                  // if (equipment.location != null) ...[
                  //   Icon(
                  //     Icons.location_on,
                  //     size: 16,
                  //     color: Colors.grey[600],
                  //   ),
                  //   const SizedBox(width: 4),
                  //   Expanded(
                  //     child: Text(
                  //       equipment.location!,
                  //       style: TextStyle(
                  //         fontSize: 12,
                  //         color: Colors.grey[600],
                  //       ),
                  //       overflow: TextOverflow.ellipsis,
                  //     ),
                  //   ),
                  //   const SizedBox(width: 16),
                  // ],
                  
                  // Condition - removed as not in API response
                  // if (equipment.condition != null) ...[
                  //   Icon(
                  //     _getConditionIcon(equipment.condition!),
                  //     size: 16,
                  //     color: _getConditionColor(equipment.condition!),
                  //   ),
                  //   const SizedBox(width: 4),
                  //   Text(
                  //     _getConditionText(equipment.condition!),
                  //     style: TextStyle(
                  //       fontSize: 12,
                  //       color: _getConditionColor(equipment.condition!),
                  //       fontWeight: FontWeight.w500,
                  //     ),
                  //   ),
                  // ],
                ],
              ),
              
              // Assignment Info
              if (equipment.isAssigned) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.assignment,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Assigned to Employee: ${equipment.assignedTo}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
              
              // Maintenance Info - removed as not in API response
              // if (equipment.isMaintenanceDue) ...[
              //   const SizedBox(height: 8),
              //   Container(
              //     padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              //     decoration: BoxDecoration(
              //       color: Colors.orange[100],
              //       borderRadius: BorderRadius.circular(8),
              //     ),
              //     child: Row(
              //       mainAxisSize: MainAxisSize.min,
              //       children: [
              //         Icon(
              //           Icons.warning,
              //           size: 16,
              //           color: Colors.orange[700],
              //         ),
              //         const SizedBox(width: 4),
              //         Text(
              //           'Maintenance Due',
              //           style: TextStyle(
              //             fontSize: 12,
              //             color: Colors.orange[700],
              //             fontWeight: FontWeight.w500,
              //           ),
              //         ),
              //       ],
              //     ),
              //   ),
              // ],
              
              // Warranty Info - removed as not in API response
              // if (equipment.isUnderWarranty) ...[
              //   const SizedBox(height: 8),
              //   Container(
              //     padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              //     decoration: BoxDecoration(
              //       color: Colors.green[100],
              //       borderRadius: BorderRadius.circular(8),
              //     ),
              //     child: Row(
              //       mainAxisSize: MainAxisSize.min,
              //       children: [
              //         Icon(
              //           Icons.verified,
              //           size: 16,
              //           color: Colors.green[700],
              //         ),
              //         const SizedBox(width: 4),
              //         Text(
              //           'Under Warranty',
              //           style: TextStyle(
              //             fontSize: 12,
              //             color: Colors.green[700],
              //             fontWeight: FontWeight.w500,
              //           ),
              //         ),
              //       ],
              //     ),
              //   ),
              // ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'available':
        return Colors.green;
      case 'in_use':
        return Colors.blue;
      case 'maintenance':
        return Colors.orange;
      case 'retired':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getConditionIcon(String condition) {
    switch (condition.toLowerCase()) {
      case 'good':
        return Icons.check_circle;
      case 'fair':
        return Icons.warning;
      case 'poor':
        return Icons.error;
      default:
        return Icons.help;
    }
  }

  Color _getConditionColor(String condition) {
    switch (condition.toLowerCase()) {
      case 'good':
        return Colors.green;
      case 'fair':
        return Colors.orange;
      case 'poor':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getConditionText(String condition) {
    switch (condition.toLowerCase()) {
      case 'good':
        return 'Good Condition';
      case 'fair':
        return 'Fair Condition';
      case 'poor':
        return 'Poor Condition';
      default:
        return condition;
    }
  }
}
