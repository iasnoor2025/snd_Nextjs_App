import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

enum BadgeVariant {
  default_,
  secondary,
  destructive,
  outline,
  success,
}

class Badge extends StatelessWidget {
  final String text;
  final BadgeVariant variant;
  final IconData? icon;
  final VoidCallback? onTap;

  const Badge({
    super.key,
    required this.text,
    this.variant = BadgeVariant.default_,
    this.icon,
    this.onTap,
  });

  const Badge.default_({
    super.key,
    required this.text,
    this.icon,
    this.onTap,
  }) : variant = BadgeVariant.default_;

  const Badge.secondary({
    super.key,
    required this.text,
    this.icon,
    this.onTap,
  }) : variant = BadgeVariant.secondary;

  const Badge.destructive({
    super.key,
    required this.text,
    this.icon,
    this.onTap,
  }) : variant = BadgeVariant.destructive;

  const Badge.outline({
    super.key,
    required this.text,
    this.icon,
    this.onTap,
  }) : variant = BadgeVariant.outline;

  const Badge.success({
    super.key,
    required this.text,
    this.icon,
    this.onTap,
  }) : variant = BadgeVariant.success;

  @override
  Widget build(BuildContext context) {
    Widget badge = Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingSm,
        vertical: AppTheme.spacingXs,
      ),
      decoration: BoxDecoration(
        color: _getBackgroundColor(),
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        border: _getBorder(),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 12,
              color: _getTextColor(),
            ),
            const SizedBox(width: AppTheme.spacingXs),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: AppTheme.fontSizeXs,
              fontWeight: AppTheme.fontWeightMedium,
              color: _getTextColor(),
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppTheme.radiusSm),
        child: badge,
      );
    }

    return badge;
  }

  Color _getBackgroundColor() {
    switch (variant) {
      case BadgeVariant.default_:
        return AppTheme.primary;
      case BadgeVariant.secondary:
        return AppTheme.secondary;
      case BadgeVariant.destructive:
        return AppTheme.destructive;
      case BadgeVariant.outline:
        return Colors.transparent;
      case BadgeVariant.success:
        return AppTheme.success;
    }
  }

  Color _getTextColor() {
    switch (variant) {
      case BadgeVariant.default_:
        return AppTheme.primaryForeground;
      case BadgeVariant.secondary:
        return AppTheme.secondaryForeground;
      case BadgeVariant.destructive:
        return AppTheme.destructiveForeground;
      case BadgeVariant.outline:
        return AppTheme.foreground;
      case BadgeVariant.success:
        return Colors.white;
    }
  }

  Border? _getBorder() {
    switch (variant) {
      case BadgeVariant.outline:
        return const Border.fromBorderSide(BorderSide(color: AppTheme.border));
      default:
        return null;
    }
  }
}

class StatusBadge extends StatelessWidget {
  final String status;
  final VoidCallback? onTap;

  const StatusBadge({
    super.key,
    required this.status,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.contains('active') || normalizedStatus.contains('success')) {
      return Badge.secondary(
        text: status,
        icon: Icons.check_circle,
        onTap: onTap,
      );
    }
    
    if (normalizedStatus.contains('inactive') || normalizedStatus.contains('pending')) {
      return Badge.outline(
        text: status,
        icon: Icons.pause_circle,
        onTap: onTap,
      );
    }
    
    if (normalizedStatus.contains('error') || normalizedStatus.contains('failed')) {
      return Badge.destructive(
        text: status,
        icon: Icons.error,
        onTap: onTap,
      );
    }
    
    return Badge.default_(
      text: status,
      onTap: onTap,
    );
  }
}
