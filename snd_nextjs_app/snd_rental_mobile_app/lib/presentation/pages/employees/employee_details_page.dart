import 'package:flutter/material.dart';
import '../../../data/models/employee_model.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../../core/theme/app_theme.dart';
import '../timesheets/timesheet_list_page.dart';
import '../documents/document_management_page.dart';

class EmployeeDetailsPage extends StatelessWidget {
  final EmployeeModel employee;

  const EmployeeDetailsPage({
    super.key,
    required this.employee,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(employee.displayName),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // TODO: Navigate to edit employee page
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Edit employee feature coming soon')),
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
            // Employee Header Card
            ui.UICard.default_(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                    child: Text(
                      employee.firstName.isNotEmpty 
                          ? employee.firstName[0].toUpperCase()
                          : 'E',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppTheme.spacingMd),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          employee.displayName,
                          style: const TextStyle(
                            fontSize: AppTheme.fontSizeXl,
                            fontWeight: AppTheme.fontWeightBold,
                            color: AppTheme.foreground,
                          ),
                        ),
                        const SizedBox(height: AppTheme.spacingXs),
                        if (employee.designation != null)
                          Text(
                            employee.designation!,
                            style: const TextStyle(
                              fontSize: AppTheme.fontSizeSm,
                              color: AppTheme.mutedForeground,
                            ),
                          ),
                        const SizedBox(height: AppTheme.spacingSm),
                        Text(
                          'File: ${employee.fileNumber} • ID: ${employee.employeeId}',
                          style: const TextStyle(
                            fontSize: AppTheme.fontSizeSm,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Contact Information
            ui.UICard.default_(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Contact Information',
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeLg,
                      fontWeight: AppTheme.fontWeightBold,
                      color: AppTheme.foreground,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMd),
                  
                  _buildInfoRow('Email', employee.email ?? 'Not provided'),
                  _buildInfoRow('Phone', employee.phone ?? 'Not provided'),
                  _buildInfoRow('Employee ID', employee.employeeId.toString()),
                  _buildInfoRow('File Number', employee.fileNumber.toString()),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Employment Information
            ui.UICard.default_(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Employment Information',
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeLg,
                      fontWeight: AppTheme.fontWeightBold,
                      color: AppTheme.foreground,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMd),
                  
                  _buildInfoRow('Department', employee.department ?? 'Not assigned'),
                  _buildInfoRow('Designation', employee.designation ?? 'Not assigned'),
                  _buildInfoRow('Hire Date', employee.hireDate ?? 'Not provided'),
                  _buildInfoRow('Current Location', employee.currentLocation ?? 'Not assigned'),
                  _buildInfoRow('Current Assignment', employee.currentAssignment ?? 'Not assigned'),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Compensation Information
            ui.UICard.default_(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Compensation',
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeLg,
                      fontWeight: AppTheme.fontWeightBold,
                      color: AppTheme.foreground,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMd),
                  
                  _buildInfoRow('Basic Salary', '${employee.basicSalary} SAR'),
                  _buildInfoRow('Hourly Rate', employee.hourlyRate != null ? '${employee.hourlyRate} SAR' : 'Not set'),
                  _buildInfoRow('Overtime Multiplier', '${employee.overtimeRateMultiplier}x'),
                  _buildInfoRow('Overtime Fixed Rate', '${employee.overtimeFixedRate} SAR'),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingMd),
            
            // Immigration Information
            ui.UICard.default_(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Immigration Information',
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeLg,
                      fontWeight: AppTheme.fontWeightBold,
                      color: AppTheme.foreground,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingMd),
                  
                  _buildInfoRow('Nationality', employee.nationality ?? 'Not provided'),
                  _buildInfoRow('Iqama Number', employee.iqamaNumber ?? 'Not provided'),
                  _buildInfoRow('Iqama Expiry', employee.iqamaExpiry ?? 'Not provided'),
                ],
              ),
            ),
            
            const SizedBox(height: AppTheme.spacingLg),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => TimesheetListPage(
                            employeeId: employee.id.toString(),
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.access_time),
                    label: const Text('View Timesheets'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.secondary,
                      foregroundColor: AppTheme.secondaryForeground,
                    ),
                  ),
                ),
                const SizedBox(width: AppTheme.spacingSm),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => DocumentManagementPage(
                            employeeId: employee.id,
                            employeeName: employee.displayName,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.folder),
                    label: const Text('Documents'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accent,
                      foregroundColor: AppTheme.accentForeground,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
}
