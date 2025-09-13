import 'package:flutter/material.dart';
import '../../data/models/rental_model.dart';

class RentalCard extends StatelessWidget {
  final RentalModel rental;
  final VoidCallback? onTap;

  const RentalCard({
    super.key,
    required this.rental,
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
              // Rental Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          rental.rentalNumber,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          rental.customerName,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                        if (rental.projectName != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'Project: ${rental.projectName}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[500],
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
                      color: _getStatusColor(rental.status),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      (rental.status ?? 'UNKNOWN').toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Rental Details
              Row(
                children: [
                  // Duration
                  if (rental.startDate != null && rental.endDate != null) ...[
                    Icon(
                      Icons.schedule,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${rental.durationInDays} days',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],
                  
                  // Priority
                  if (rental.priority != null) ...[
                    Icon(
                      _getPriorityIcon(rental.priority!),
                      size: 16,
                      color: _getPriorityColor(rental.priority!),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _getPriorityText(rental.priority!),
                      style: TextStyle(
                        fontSize: 12,
                        color: _getPriorityColor(rental.priority!),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Financial Information
              if (rental.totalAmount != null) ...[
                Row(
                  children: [
                    Icon(
                      Icons.account_balance_wallet,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Total: ${rental.currency ?? 'SAR'} ${rental.totalAmount!.toStringAsFixed(0)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                    if (rental.paidAmount != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        'Paid: ${rental.currency ?? 'SAR'} ${rental.paidAmount!.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.green[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    if (rental.balanceAmount != null && rental.balanceAmount! > 0) ...[
                      const SizedBox(width: 8),
                      Text(
                        'Balance: ${rental.currency ?? 'SAR'} ${rental.balanceAmount!.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.red[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
              
              const SizedBox(height: 8),
              
              // Payment Status
              if (rental.paymentStatus != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getPaymentStatusColor(rental.paymentStatus!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _getPaymentStatusIcon(rental.paymentStatus!),
                        size: 16,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _getPaymentStatusText(rental.paymentStatus!),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              // Location
              if (rental.address != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.location_on,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        rental.address!,
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
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.blue;
      case 'active':
        return Colors.green;
      case 'completed':
        return Colors.purple;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getPriorityIcon(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return Icons.keyboard_arrow_up;
      case 'medium':
        return Icons.remove;
      case 'low':
        return Icons.keyboard_arrow_down;
      default:
        return Icons.remove;
    }
  }

  Color _getPriorityColor(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getPriorityText(String priority) {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      default:
        return priority;
    }
  }

  Color _getPaymentStatusColor(String paymentStatus) {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return Colors.green;
      case 'partial':
        return Colors.orange;
      case 'pending':
        return Colors.red;
      case 'overdue':
        return Colors.red[800]!;
      default:
        return Colors.grey;
    }
  }

  IconData _getPaymentStatusIcon(String paymentStatus) {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return Icons.check_circle;
      case 'partial':
        return Icons.pending;
      case 'pending':
        return Icons.schedule;
      case 'overdue':
        return Icons.warning;
      default:
        return Icons.help;
    }
  }

  String _getPaymentStatusText(String paymentStatus) {
    switch (paymentStatus.toLowerCase()) {
      case 'paid':
        return 'Fully Paid';
      case 'partial':
        return 'Partially Paid';
      case 'pending':
        return 'Payment Pending';
      case 'overdue':
        return 'Payment Overdue';
      default:
        return paymentStatus;
    }
  }
}
