import 'package:flutter/material.dart';
import '../../data/models/equipment_model.dart';
import '../../core/theme/app_theme.dart';
import 'ui/card.dart';
import 'ui/badge.dart';

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
    return UICard(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing),
      onTap: onTap,
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
                  color: AppTheme.muted,
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
                child: const Icon(
                  Icons.build,
                  size: 30,
                  color: AppTheme.mutedForeground,
                ),
              ),
              
              const SizedBox(width: AppTheme.spacing),
              
              // Equipment Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CardTitle(text: equipment.displayName),
                    if (equipment.serialNumber != null) ...[
                      const SizedBox(height: AppTheme.spacingXs),
                      CardDescription(text: 'SN: ${equipment.serialNumber}'),
                    ],
                    if (equipment.categoryId != null) ...[
                      const SizedBox(height: AppTheme.spacingXs),
                      CardDescription(text: 'Category: ${equipment.categoryId!}'),
                    ],
                  ],
                ),
              ),
              
              // Status Badge
              StatusBadge(status: equipment.status ?? 'UNKNOWN'),
            ],
          ),
          
          const SizedBox(height: AppTheme.spacing),
          
          // Assignment Info
          if (equipment.isAssigned) ...[
            Row(
              children: [
                const Icon(
                  Icons.assignment,
                  size: 16,
                  color: AppTheme.mutedForeground,
                ),
                const SizedBox(width: AppTheme.spacingXs),
                Expanded(
                  child: Text(
                    'Assigned to Employee: ${equipment.assignedTo}',
                    style: const TextStyle(
                      fontSize: AppTheme.fontSizeSm,
                      color: AppTheme.mutedForeground,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}