import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/timesheet_provider.dart';
import '../../../data/models/timesheet_model.dart';
import '../../widgets/ui/button.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../../core/theme/app_theme.dart';

class AddTimesheetPage extends StatefulWidget {
  final String? employeeId;
  final String? projectId;

  const AddTimesheetPage({
    super.key,
    this.employeeId,
    this.projectId,
  });

  @override
  State<AddTimesheetPage> createState() => _AddTimesheetPageState();
}

class _AddTimesheetPageState extends State<AddTimesheetPage> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  
  DateTime _selectedDate = DateTime.now();
  double _hoursWorked = 8.0;
  double _overtimeHours = 0.0;
  String? _selectedProjectId;
  String? _selectedEmployeeId;

  @override
  void initState() {
    super.initState();
    _selectedEmployeeId = widget.employeeId;
    _selectedProjectId = widget.projectId;
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _saveTimesheet() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final timesheet = TimesheetModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        employeeId: _selectedEmployeeId ?? 'current-user',
        employeeName: 'Current User', // TODO: Get from auth service
        projectId: _selectedProjectId,
        projectName: _selectedProjectId != null ? 'Selected Project' : null,
        date: _selectedDate,
        hoursWorked: _hoursWorked,
        overtimeHours: _overtimeHours > 0 ? _overtimeHours : null,
        description: _descriptionController.text.trim().isNotEmpty 
            ? _descriptionController.text.trim() 
            : null,
        status: 'pending',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await context.read<TimesheetProvider>().createTimesheet(timesheet);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Timesheet added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding timesheet: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Timesheet'),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacingMd),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Date Selection
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Date',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    InkWell(
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: _selectedDate,
                          firstDate: DateTime.now().subtract(const Duration(days: 30)),
                          lastDate: DateTime.now(),
                        );
                        if (date != null) {
                          setState(() {
                            _selectedDate = date;
                          });
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(AppTheme.spacingSm),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.border),
                          borderRadius: BorderRadius.circular(AppTheme.radius),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.calendar_today,
                              color: AppTheme.mutedForeground,
                            ),
                            const SizedBox(width: AppTheme.spacingSm),
                            Text(
                              '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                              style: TextStyle(
                                fontSize: AppTheme.fontSizeSm,
                                color: AppTheme.foreground,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingMd),
              
              // Hours Worked
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hours Worked',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    Row(
                      children: [
                        Expanded(
                          child: Slider(
                            value: _hoursWorked,
                            min: 0.5,
                            max: 12.0,
                            divisions: 23,
                            label: '${_hoursWorked.toStringAsFixed(1)} hours',
                            onChanged: (value) {
                              setState(() {
                                _hoursWorked = value;
                              });
                            },
                          ),
                        ),
                        Container(
                          width: 80,
                          padding: const EdgeInsets.all(AppTheme.spacingSm),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(AppTheme.radius),
                          ),
                          child: Text(
                            '${_hoursWorked.toStringAsFixed(1)}h',
                            style: TextStyle(
                              fontSize: AppTheme.fontSizeLg,
                              fontWeight: AppTheme.fontWeightBold,
                              color: AppTheme.primary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingMd),
              
              // Overtime Hours
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Overtime Hours (Optional)',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    Row(
                      children: [
                        Expanded(
                          child: Slider(
                            value: _overtimeHours,
                            min: 0.0,
                            max: 8.0,
                            divisions: 16,
                            label: _overtimeHours > 0 
                                ? '${_overtimeHours.toStringAsFixed(1)} hours' 
                                : 'No overtime',
                            onChanged: (value) {
                              setState(() {
                                _overtimeHours = value;
                              });
                            },
                          ),
                        ),
                        Container(
                          width: 80,
                          padding: const EdgeInsets.all(AppTheme.spacingSm),
                          decoration: BoxDecoration(
                            color: _overtimeHours > 0 
                                ? AppTheme.accent.withValues(alpha: 0.1)
                                : AppTheme.muted,
                            borderRadius: BorderRadius.circular(AppTheme.radius),
                          ),
                          child: Text(
                            _overtimeHours > 0 
                                ? '${_overtimeHours.toStringAsFixed(1)}h'
                                : '0h',
                            style: TextStyle(
                              fontSize: AppTheme.fontSizeLg,
                              fontWeight: AppTheme.fontWeightBold,
                              color: _overtimeHours > 0 
                                  ? AppTheme.accent
                                  : AppTheme.mutedForeground,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingMd),
              
              // Project Selection (if not pre-selected)
              if (widget.projectId == null)
                ui.UICard.default_(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Project (Optional)',
                        style: TextStyle(
                          fontSize: AppTheme.fontSizeLg,
                          fontWeight: AppTheme.fontWeightBold,
                          color: AppTheme.foreground,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacingSm),
                      DropdownButtonFormField<String>(
                        value: _selectedProjectId,
                        decoration: InputDecoration(
                          hintText: 'Select a project',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(AppTheme.radius),
                          ),
                        ),
                        items: [
                          const DropdownMenuItem(
                            value: null,
                            child: Text('No project'),
                          ),
                          // TODO: Load actual projects from provider
                          const DropdownMenuItem(
                            value: 'project-1',
                            child: Text('Project Alpha'),
                          ),
                          const DropdownMenuItem(
                            value: 'project-2',
                            child: Text('Project Beta'),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedProjectId = value;
                          });
                        },
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: AppTheme.spacingMd),
              
              // Description
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Description (Optional)',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    TextField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'Describe what you worked on...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppTheme.radius),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingLg),
              
              // Summary Card
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Summary',
                      style: TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    Row(
                      children: [
                        Expanded(
                          child: _buildSummaryItem(
                            'Date',
                            '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                            Icons.calendar_today,
                          ),
                        ),
                        Expanded(
                          child: _buildSummaryItem(
                            'Regular Hours',
                            '${_hoursWorked.toStringAsFixed(1)}h',
                            Icons.access_time,
                          ),
                        ),
                      ],
                    ),
                    if (_overtimeHours > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: AppTheme.spacingSm),
                        child: _buildSummaryItem(
                          'Overtime Hours',
                          '${_overtimeHours.toStringAsFixed(1)}h',
                          Icons.schedule,
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.only(top: AppTheme.spacingSm),
                      child: _buildSummaryItem(
                        'Total Hours',
                        '${(_hoursWorked + _overtimeHours).toStringAsFixed(1)}h',
                        Icons.timer,
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingLg),
              
              // Save Button
              Button(
                text: 'Submit Timesheet',
                onPressed: _saveTimesheet,
                variant: ButtonVariant.default_,
                isFullWidth: true,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: AppTheme.mutedForeground,
        ),
        const SizedBox(width: AppTheme.spacingXs),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: AppTheme.fontSizeXs,
                  color: AppTheme.mutedForeground,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  fontWeight: AppTheme.fontWeightMedium,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
