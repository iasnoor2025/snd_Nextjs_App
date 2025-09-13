import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/employee_provider.dart';
import '../../../data/models/employee_model.dart';
import '../../widgets/ui/button.dart';
import '../../widgets/ui/input.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../../core/theme/app_theme.dart';

class AddEmployeePage extends StatefulWidget {
  const AddEmployeePage({super.key});

  @override
  State<AddEmployeePage> createState() => _AddEmployeePageState();
}

class _AddEmployeePageState extends State<AddEmployeePage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _employeeIdController = TextEditingController();
  final _departmentController = TextEditingController();
  final _designationController = TextEditingController();
  final _basicSalaryController = TextEditingController();
  final _hourlyRateController = TextEditingController();
  
  String _status = 'active';
  String? _nationality;
  String? _iqamaNumber;
  String? _iqamaExpiry;

  final List<String> _statusOptions = ['active', 'inactive', 'terminated'];
  final List<String> _nationalityOptions = [
    'Saudi',
    'Indian',
    'Pakistani',
    'Bangladeshi',
    'Filipino',
    'Egyptian',
    'Other'
  ];

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _employeeIdController.dispose();
    _departmentController.dispose();
    _designationController.dispose();
    _basicSalaryController.dispose();
    _hourlyRateController.dispose();
    super.dispose();
  }

  Future<void> _saveEmployee() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final employee = EmployeeModel(
        id: DateTime.now().millisecondsSinceEpoch,
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        email: _emailController.text.trim().isNotEmpty ? _emailController.text.trim() : null,
        phone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
        employeeId: int.tryParse(_employeeIdController.text) ?? 0,
        fileNumber: int.tryParse(_employeeIdController.text) ?? 0,
        department: _departmentController.text.trim().isNotEmpty ? _departmentController.text.trim() : null,
        designation: _designationController.text.trim().isNotEmpty ? _designationController.text.trim() : null,
        basicSalary: int.tryParse(_basicSalaryController.text) ?? 0,
        hourlyRate: double.tryParse(_hourlyRateController.text),
        status: _status,
        nationality: _nationality,
        iqamaNumber: _iqamaNumber,
        iqamaExpiry: _iqamaExpiry,
        fullName: '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}',
        hireDate: DateTime.now().toIso8601String().split('T')[0],
        user: null,
      );

      await context.read<EmployeeProvider>().createEmployee(employee);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Employee added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error adding employee: $e'),
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
        title: const Text('Add Employee'),
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
              // Personal Information
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Personal Information',
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingMd),
                    
                    Row(
                      children: [
                        Expanded(
                          child: Input(
                            controller: _firstNameController,
                            label: 'First Name',
                            hint: 'Enter first name',
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'First name is required';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: AppTheme.spacingSm),
                        Expanded(
                          child: Input(
                            controller: _lastNameController,
                            label: 'Last Name',
                            hint: 'Enter last name',
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Last name is required';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    Input(
                      controller: _emailController,
                      label: 'Email',
                      hint: 'Enter email address',
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    Input(
                      controller: _phoneController,
                      label: 'Phone',
                      hint: 'Enter phone number',
                      keyboardType: TextInputType.phone,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingMd),
              
              // Employment Information
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Employment Information',
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingMd),
                    
                    Input(
                      controller: _employeeIdController,
                      label: 'Employee ID',
                      hint: 'Enter employee ID',
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    Input(
                      controller: _departmentController,
                      label: 'Department',
                      hint: 'Enter department',
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    Input(
                      controller: _designationController,
                      label: 'Designation',
                      hint: 'Enter designation/position',
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    DropdownButtonFormField<String>(
                      value: _status,
                      decoration: InputDecoration(
                        labelText: 'Status',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppTheme.radius),
                        ),
                      ),
                      items: _statusOptions.map((status) {
                        return DropdownMenuItem(
                          value: status,
                          child: Text(status.toUpperCase()),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _status = value!;
                        });
                      },
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingMd),
              
              // Compensation Information
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Compensation',
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingMd),
                    
                    Input(
                      controller: _basicSalaryController,
                      label: 'Basic Salary (SAR)',
                      hint: 'Enter basic salary',
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    Input(
                      controller: _hourlyRateController,
                      label: 'Hourly Rate (SAR)',
                      hint: 'Enter hourly rate',
                      keyboardType: TextInputType.number,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingMd),
              
              // Immigration Information
              ui.UICard.default_(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Immigration Information',
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeLg,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacingMd),
                    
                    DropdownButtonFormField<String>(
                      value: _nationality,
                      decoration: InputDecoration(
                        labelText: 'Nationality',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppTheme.radius),
                        ),
                      ),
                      items: _nationalityOptions.map((nationality) {
                        return DropdownMenuItem(
                          value: nationality,
                          child: Text(nationality),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _nationality = value;
                        });
                      },
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    Input(
                      label: 'Iqama Number',
                      hint: 'Enter Iqama number',
                      onChanged: (value) => _iqamaNumber = value,
                    ),
                    const SizedBox(height: AppTheme.spacingSm),
                    
                    Input(
                      label: 'Iqama Expiry',
                      hint: 'YYYY-MM-DD',
                      onChanged: (value) => _iqamaExpiry = value,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: AppTheme.spacingLg),
              
              // Save Button
              Button(
                text: 'Add Employee',
                onPressed: _saveEmployee,
                variant: ButtonVariant.default_,
                isFullWidth: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
