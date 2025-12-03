import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

enum ButtonVariant {
  default_,
  destructive,
  outline,
  secondary,
  ghost,
  link,
}

enum ButtonSize {
  default_,
  sm,
  lg,
  icon,
}

class Button extends StatelessWidget {
  final String? text;
  final IconData? icon;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ButtonSize size;
  final bool isLoading;
  final bool isFullWidth;

  const Button({
    super.key,
    this.text,
    this.icon,
    this.onPressed,
    this.variant = ButtonVariant.default_,
    this.size = ButtonSize.default_,
    this.isLoading = false,
    this.isFullWidth = false,
  });

  const Button.default_({
    super.key,
    required this.text,
    this.onPressed,
    this.size = ButtonSize.default_,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : variant = ButtonVariant.default_,
       icon = null;

  const Button.destructive({
    super.key,
    required this.text,
    this.onPressed,
    this.size = ButtonSize.default_,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : variant = ButtonVariant.destructive,
       icon = null;

  const Button.outline({
    super.key,
    required this.text,
    this.onPressed,
    this.size = ButtonSize.default_,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : variant = ButtonVariant.outline,
       icon = null;

  const Button.secondary({
    super.key,
    required this.text,
    this.onPressed,
    this.size = ButtonSize.default_,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : variant = ButtonVariant.secondary,
       icon = null;

  const Button.ghost({
    super.key,
    required this.text,
    this.onPressed,
    this.size = ButtonSize.default_,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : variant = ButtonVariant.ghost,
       icon = null;

  const Button.link({
    super.key,
    required this.text,
    this.onPressed,
    this.size = ButtonSize.default_,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : variant = ButtonVariant.link,
       icon = null;

  const Button.icon({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = ButtonSize.icon,
    this.isLoading = false,
  }) : variant = ButtonVariant.default_,
       text = null,
       isFullWidth = false;

  @override
  Widget build(BuildContext context) {
    Widget child = _buildChild();
    
    if (isFullWidth) {
      child = SizedBox(
        width: double.infinity,
        child: child,
      );
    }

    return child;
  }

  Widget _buildChild() {
    switch (variant) {
      case ButtonVariant.default_:
        return _buildElevatedButton();
      case ButtonVariant.destructive:
        return _buildDestructiveButton();
      case ButtonVariant.outline:
        return _buildOutlinedButton();
      case ButtonVariant.secondary:
        return _buildSecondaryButton();
      case ButtonVariant.ghost:
        return _buildGhostButton();
      case ButtonVariant.link:
        return _buildLinkButton();
    }
  }

  Widget _buildElevatedButton() {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_getBorderRadius()),
        ),
        padding: _getPadding(),
        minimumSize: _getMinimumSize(),
      ),
      child: _buildButtonContent(),
    );
  }

  Widget _buildDestructiveButton() {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.destructive,
        foregroundColor: AppTheme.destructiveForeground,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_getBorderRadius()),
        ),
        padding: _getPadding(),
        minimumSize: _getMinimumSize(),
      ),
      child: _buildButtonContent(),
    );
  }

  Widget _buildOutlinedButton() {
    return OutlinedButton(
      onPressed: isLoading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: AppTheme.primary,
        side: const BorderSide(color: AppTheme.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_getBorderRadius()),
        ),
        padding: _getPadding(),
        minimumSize: _getMinimumSize(),
      ),
      child: _buildButtonContent(),
    );
  }

  Widget _buildSecondaryButton() {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppTheme.secondary,
        foregroundColor: AppTheme.secondaryForeground,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_getBorderRadius()),
        ),
        padding: _getPadding(),
        minimumSize: _getMinimumSize(),
      ),
      child: _buildButtonContent(),
    );
  }

  Widget _buildGhostButton() {
    return TextButton(
      onPressed: isLoading ? null : onPressed,
      style: TextButton.styleFrom(
        foregroundColor: AppTheme.primary,
        backgroundColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_getBorderRadius()),
        ),
        padding: _getPadding(),
        minimumSize: _getMinimumSize(),
      ),
      child: _buildButtonContent(),
    );
  }

  Widget _buildLinkButton() {
    return TextButton(
      onPressed: isLoading ? null : onPressed,
      style: TextButton.styleFrom(
        foregroundColor: AppTheme.primary,
        backgroundColor: Colors.transparent,
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        text ?? '',
        style: TextStyle(
          fontSize: _getFontSize(),
          fontWeight: AppTheme.fontWeightMedium,
          decoration: TextDecoration.underline,
        ),
      ),
    );
  }

  Widget _buildButtonContent() {
    if (isLoading) {
      return SizedBox(
        width: _getIconSize(),
        height: _getIconSize(),
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(
            variant == ButtonVariant.default_ || variant == ButtonVariant.destructive
                ? AppTheme.primaryForeground
                : AppTheme.primary,
          ),
        ),
      );
    }

    if (icon != null && text != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: _getIconSize()),
          const SizedBox(width: AppTheme.spacingSm),
          Text(
            text!,
            style: TextStyle(
              fontSize: _getFontSize(),
              fontWeight: AppTheme.fontWeightMedium,
            ),
          ),
        ],
      );
    }

    if (icon != null) {
      return Icon(icon, size: _getIconSize());
    }

    return Text(
      text ?? '',
      style: TextStyle(
        fontSize: _getFontSize(),
        fontWeight: AppTheme.fontWeightMedium,
      ),
    );
  }

  double _getBorderRadius() {
    switch (size) {
      case ButtonSize.sm:
        return AppTheme.radiusSm;
      case ButtonSize.lg:
        return AppTheme.radiusLg;
      default:
        return AppTheme.radius;
    }
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case ButtonSize.sm:
        return const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingSm,
          vertical: AppTheme.spacingXs,
        );
      case ButtonSize.lg:
        return const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingMd,
        );
      case ButtonSize.icon:
        return const EdgeInsets.all(AppTheme.spacingSm);
      default:
        return const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingMd,
          vertical: AppTheme.spacingSm,
        );
    }
  }

  Size _getMinimumSize() {
    switch (size) {
      case ButtonSize.sm:
        return const Size(0, 32);
      case ButtonSize.lg:
        return const Size(0, 48);
      case ButtonSize.icon:
        return const Size(40, 40);
      default:
        return const Size(0, 40);
    }
  }

  double _getFontSize() {
    switch (size) {
      case ButtonSize.sm:
        return AppTheme.fontSizeSm;
      case ButtonSize.lg:
        return AppTheme.fontSizeLg;
      default:
        return AppTheme.fontSizeBase;
    }
  }

  double _getIconSize() {
    switch (size) {
      case ButtonSize.sm:
        return 16;
      case ButtonSize.lg:
        return 20;
      default:
        return 18;
    }
  }
}
