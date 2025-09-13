import 'package:flutter/material.dart';
import '../../data/models/employee_model.dart';
import '../widgets/ui/card.dart' as ui;
import '../widgets/ui/badge.dart' as ui;
import '../../core/theme/app_theme.dart';

class EmployeeCard extends StatefulWidget {
  final EmployeeModel employee;
  final VoidCallback? onTap;

  const EmployeeCard({
    super.key,
    required this.employee,
    this.onTap,
  });

  @override
  State<EmployeeCard> createState() => _EmployeeCardState();
}

class _EmployeeCardState extends State<EmployeeCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _glowAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            child: ui.UICard.default_(
              child: InkWell(
                onTap: () {
                  _animationController.forward().then((_) {
                    _animationController.reverse();
                    widget.onTap?.call();
                  });
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.white,
                        Colors.grey.shade50,
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha:0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                      BoxShadow(
                        color: _getStatusColor().withValues(alpha:_glowAnimation.value * 0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 0),
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        // Futuristic Avatar
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                _getStatusColor(),
                                _getStatusColor().withValues(alpha:0.7),
                              ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: _getStatusColor().withValues(alpha:0.3),
                                blurRadius: 15,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              _getInitials(),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        
                        // Employee Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Name
                              Text(
                                widget.employee.displayName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.foreground,
                                ),
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                              const SizedBox(height: 4),
                              
                              // File Number & Employee ID in one row
                              Row(
                                children: [
                                  _buildInfoChip(
                                    'File: ${widget.employee.fileNumber}',
                                    Icons.folder_outlined,
                                    AppTheme.primary,
                                  ),
                                  const SizedBox(width: 8),
                                  _buildInfoChip(
                                    'ID: ${widget.employee.employeeId}',
                                    Icons.badge_outlined,
                                    AppTheme.secondary,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        
                        // Status Badge
                        ui.Badge(
                          text: widget.employee.status.toUpperCase(),
                          variant: widget.employee.isActive 
                              ? ui.BadgeVariant.success 
                              : ui.BadgeVariant.destructive,
                        ),
                        
                        const SizedBox(width: 8),
                        
                        // Action Indicator
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha:0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: AppTheme.primary.withValues(alpha:0.3),
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            Icons.arrow_forward_ios,
                            size: 14,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoChip(String text, IconData icon, Color color) {
    return Flexible(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha:0.1),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withValues(alpha:0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 3),
            Flexible(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompactInfo(IconData icon, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.muted.withValues(alpha:0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: AppTheme.border.withValues(alpha:0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 14,
            color: AppTheme.mutedForeground,
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppTheme.foreground,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    String value, {
    bool isCompact = false,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: isCompact ? 14 : 16,
          color: AppTheme.mutedForeground,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: isCompact ? 10 : 12,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.mutedForeground,
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: isCompact ? 12 : 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.foreground,
                ),
                maxLines: isCompact ? 1 : 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Color _getStatusColor() {
    return widget.employee.isActive ? AppTheme.success : AppTheme.destructive;
  }

  String _getInitials() {
    final firstName = widget.employee.firstName.isNotEmpty 
        ? widget.employee.firstName[0] 
        : 'E';
    final lastName = widget.employee.lastName.isNotEmpty 
        ? widget.employee.lastName[0] 
        : '';
    return '$firstName$lastName'.toUpperCase();
  }
}
