import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class FuturisticBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const FuturisticBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 80,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppTheme.primary.withValues(alpha: 0.95),
            AppTheme.primary.withValues(alpha: 0.98),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppTheme.radiusXl),
          topRight: Radius.circular(AppTheme.radiusXl),
        ),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppTheme.primary.withValues(alpha: 0.1),
                AppTheme.primary.withValues(alpha: 0.05),
              ],
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildNavItem(0, Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
              _buildNavItem(1, Icons.people_outline, Icons.people, 'Employees'),
              _buildNavItem(2, Icons.work_outline, Icons.work, 'Projects'),
              _buildNavItem(3, Icons.build_outlined, Icons.build, 'Equipment'),
              _buildNavItem(4, Icons.receipt_long_outlined, Icons.receipt_long, 'Rentals'),
              _buildNavItem(5, Icons.business_outlined, Icons.business, 'Customers'),
              _buildNavItem(6, Icons.person_outline, Icons.person, 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData inactiveIcon, IconData activeIcon, String label) {
    final isSelected = currentIndex == index;
    
    return GestureDetector(
      onTap: () => onTap(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingXs,
          vertical: AppTheme.spacingXs,
        ),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          gradient: isSelected
              ? LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppTheme.primaryForeground.withValues(alpha: 0.2),
                    AppTheme.primaryForeground.withValues(alpha: 0.1),
                  ],
                )
              : null,
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.primaryForeground.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.all(AppTheme.spacingXs),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppTheme.radius),
                color: isSelected
                    ? AppTheme.primaryForeground.withValues(alpha: 0.15)
                    : Colors.transparent,
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  isSelected ? activeIcon : inactiveIcon,
                  key: ValueKey(isSelected),
                  color: isSelected
                      ? AppTheme.primaryForeground
                      : AppTheme.primaryForeground.withValues(alpha: 0.6),
                  size: isSelected ? 24 : 22,
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingXs),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 300),
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? AppTheme.fontWeightMedium : AppTheme.fontWeightNormal,
                color: isSelected
                    ? AppTheme.primaryForeground
                    : AppTheme.primaryForeground.withValues(alpha: 0.7),
              ),
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class FuturisticBottomNavWithIndicator extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const FuturisticBottomNavWithIndicator({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: AppTheme.background,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background with gradient
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppTheme.background,
                  AppTheme.background.withValues(alpha: 0.95),
                ],
              ),
            ),
          ),
          
          // Animated indicator
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeInOut,
            left: _getIndicatorPosition(),
            top: 0,
            child: Container(
              width: 60,
              height: 4,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppTheme.primary,
                    AppTheme.primary.withValues(alpha: 0.8),
                  ],
                ),
                borderRadius: BorderRadius.circular(2),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.5),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
            ),
          ),
          
          // Navigation items
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildNavItem(0, Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
              _buildNavItem(1, Icons.people_outline, Icons.people, 'Employees'),
              _buildNavItem(2, Icons.work_outline, Icons.work, 'Projects'),
              _buildNavItem(3, Icons.build_outlined, Icons.build, 'Equipment'),
              _buildNavItem(4, Icons.receipt_long_outlined, Icons.receipt_long, 'Rentals'),
              _buildNavItem(5, Icons.business_outlined, Icons.business, 'Customers'),
              _buildNavItem(6, Icons.person_outline, Icons.person, 'Profile'),
            ],
          ),
        ],
      ),
    );
  }

  double _getIndicatorPosition() {
    final screenWidth = WidgetsBinding.instance.platformDispatcher.views.first.physicalSize.width /
        WidgetsBinding.instance.platformDispatcher.views.first.devicePixelRatio;
    final itemWidth = screenWidth / 7;
    return (itemWidth * currentIndex) + (itemWidth - 60) / 2;
  }

  Widget _buildNavItem(int index, IconData inactiveIcon, IconData activeIcon, String label) {
    final isSelected = currentIndex == index;
    
    return GestureDetector(
      onTap: () => onTap(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingXs,
          vertical: AppTheme.spacingXs,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              padding: const EdgeInsets.all(AppTheme.spacingSm),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                color: isSelected
                    ? AppTheme.primary.withValues(alpha: 0.1)
                    : Colors.transparent,
                border: isSelected
                    ? Border.all(
                        color: AppTheme.primary.withValues(alpha: 0.3),
                        width: 1,
                      )
                    : null,
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  isSelected ? activeIcon : inactiveIcon,
                  key: ValueKey(isSelected),
                  color: isSelected ? AppTheme.primary : AppTheme.mutedForeground,
                  size: isSelected ? 26 : 24,
                ),
              ),
            ),
            const SizedBox(height: AppTheme.spacingXs),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 300),
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? AppTheme.fontWeightMedium : AppTheme.fontWeightNormal,
                color: isSelected ? AppTheme.primary : AppTheme.mutedForeground,
              ),
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
