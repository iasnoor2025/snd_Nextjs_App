import 'package:flutter/material.dart';
import '../../../data/models/timesheet_model.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../widgets/ui/button.dart';
import '../../widgets/ui/badge.dart' as ui;
import '../../../core/theme/app_theme.dart';

class TimesheetDetailsPage extends StatelessWidget {
  final TimesheetModel timesheet;

  const TimesheetDetailsPage({
    super.key,
    required this.timesheet,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Timesheet Details'),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
        actions: [
          if (timesheet.status == 'pending')
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () {
                // TODO: Navigate to edit timesheet page
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Edit timesheet feature coming soon')),
                );
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Header
            ui.UICard.default_(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(AppTheme.spacingSm),
                    decoration: BoxDecoration(
                      color: _getStatusColor(timesheet.status).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radius),
                    ),
                    child: Icon(
                      _getStatusIcon(timesheet.status),
                      color: _getStatusColor(timesheet.status),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingMd),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Timesheet #${timesheet.id}',
                          style: const TextStyle(
                            fontSize: AppTheme.fontSizeLg,
                            fontWeight: AppTheme.fontWeightBold,
                            color: AppTheme.foreground,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingXs),
                        ui.Badge(
                          text: timesheet.status.toUpperCase(),
                          variant: _getStatusVariant(timesheet.status),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Employee Information
            ui.UICard.default_(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Employee Information',
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeLg,
                      fontWeight: AppTheme.fontWeightBold,
                      color: AppTheme.foreground,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMd),
                  
                  _buildInfoRow('Employee', timesheet.employeeName, Icons.person),
                  _buildInfoRow('Employee ID', timesheet.employeeId, Icons.badge),
                  if (timesheet.projectName != null)
                    _buildInfoRow('Project', timesheet.projectName!, Icons.work),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Time Information
            ui.UICard.default_(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Time Information',
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeLg,
                      fontWeight: AppTheme.fontWeightBold,
                      color: AppTheme.foreground,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMd),
                  
                  Row(
                    children: [
                      Expanded(
                        child: _buildTimeCard(
                          'Date',
                          timesheet.displayDate,
                          Icons.calendar_today,
                          AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: AppTheme.spacingSm),
                      Expanded(
                        child: _buildTimeCard(
                          'Regular Hours',
                          timesheet.displayHours,
                          Icons.access_time,
                          AppTheme.secondary,
                        ),
                      ),
                    ],
                  ),
                  
                  if (timesheet.overtimeHours != null && timesheet.overtimeHours! > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: AppTheme.spacingSm),
                      child: _buildTimeCard(
                        'Overtime Hours',
                        '${timesheet.overtimeHours!.toStringAsFixed(1)}h',
                        Icons.schedule,
                        AppTheme.accent,
                      ),
                    ),
                  
                  Padding(
                    padding: const EdgeInsets.only(top: AppTheme.spacingSm),
                    child: _buildTimeCard(
                      'Total Hours',
                      timesheet.displayTotalHours,
                      Icons.timer,
                      AppTheme.destructive,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Description
            if (timesheet.description != null && timesheet.description!.isNotEmpty)
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Description',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingMd),
                    Text(
                      timesheet.description!,
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeSm,
                        color: AppTheme.foreground,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Approval Information
            if (timesheet.status != 'pending')
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Approval Information',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingMd),
                    
                    if (timesheet.approvedByName != null)
                      _buildInfoRow('Approved By', timesheet.approvedByName!, Icons.check_circle),
                    if (timesheet.approvedAt != null)
                      _buildInfoRow('Approved At', 
                          '${timesheet.approvedAt!.day}/${timesheet.approvedAt!.month}/${timesheet.approvedAt!.year}', 
                          Icons.schedule),
                    if (timesheet.rejectionReason != null)
                      _buildInfoRow('Rejection Reason', timesheet.rejectionReason!, Icons.cancel),
                  ],
                ),
              ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Timestamps
            ui.UICard.default_(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Timestamps',
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeLg,
                      fontWeight: AppTheme.fontWeightBold,
                      color: AppTheme.foreground,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMd),
                  
                  _buildInfoRow('Created', 
                      '${timesheet.createdAt.day}/${timesheet.createdAt.month}/${timesheet.createdAt.year}', 
                      Icons.add_circle),
                  _buildInfoRow('Last Updated', 
                      '${timesheet.updatedAt.day}/${timesheet.updatedAt.month}/${timesheet.updatedAt.year}', 
                      Icons.update),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingLg),
            
            // Action Buttons
            if (timesheet.status == 'pending')
              Row(
                children: [
                  Expanded(
                    child: Button.outline(
                      text: 'Edit',
                      onPressed: () {
                        // TODO: Navigate to edit timesheet page
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Edit timesheet feature coming soon')),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingSm),
                  Expanded(
                    child: Button.destructive(
                      text: 'Delete',
                      onPressed: () {
                        _showDeleteConfirmation(context);
                      },
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: AppTheme.mutedForeground,
          ),
          const SizedBox(width: AppTheme.spacingSm),
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: AppTheme.fontSizeSm,
                fontWeight: AppTheme.fontWeightMedium,
                color: AppTheme.mutedForeground,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: AppTheme.fontSizeSm,
                color: AppTheme.foreground,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacingSm),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppTheme.radius),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 20,
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Text(
            label,
            style: const TextStyle(
              fontSize: AppTheme.fontSizeXs,
              color: AppTheme.mutedForeground,
            ),
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Text(
            value,
            style: TextStyle(
              fontSize: AppTheme.fontSizeSm,
              fontWeight: AppTheme.fontWeightBold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'pending':
      default:
        return Colors.orange;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'pending':
      default:
        return Icons.pending;
    }
  }

  ui.BadgeVariant _getStatusVariant(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return ui.BadgeVariant.default_;
      case 'rejected':
        return ui.BadgeVariant.destructive;
      case 'pending':
      default:
        return ui.BadgeVariant.secondary;
    }
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Timesheet'),
        content: const Text('Are you sure you want to delete this timesheet? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // TODO: Implement delete functionality
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Delete functionality coming soon')),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
