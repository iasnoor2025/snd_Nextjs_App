import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class UICard extends StatelessWidget {
  final Widget? child;
  final VoidCallback? onTap;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final List<BoxShadow>? boxShadow;
  final Border? border;

  const UICard({
    super.key,
    this.child,
    this.onTap,
    this.padding,
    this.margin,
    this.backgroundColor,
    this.borderRadius,
    this.boxShadow,
    this.border,
  });

  const UICard.default_({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
    this.margin,
  }) : backgroundColor = AppTheme.card,
       borderRadius = null,
       boxShadow = null,
       border = null;

  const UICard.outlined({
    super.key,
    required this.child,
    this.onTap,
    this.padding,
    this.margin,
  }) : backgroundColor = AppTheme.card,
       borderRadius = null,
       boxShadow = null,
       border = const Border.fromBorderSide(BorderSide(color: AppTheme.border));

  @override
  Widget build(BuildContext context) {
    Widget cardChild = Container(
      padding: padding ?? const EdgeInsets.all(AppTheme.spacingMd),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppTheme.card,
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radiusLg),
        boxShadow: boxShadow ?? AppTheme.shadowSm,
        border: border,
      ),
      child: child,
    );

    if (margin != null) {
      cardChild = Container(
        margin: margin,
        child: cardChild,
      );
    }

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radiusLg),
        child: cardChild,
      );
    }

    return cardChild;
  }
}

class CardHeader extends StatelessWidget {
  final Widget? child;
  final EdgeInsets? padding;

  const CardHeader({
    super.key,
    this.child,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(AppTheme.spacingMd),
      child: child,
    );
  }
}

class CardTitle extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const CardTitle({
    super.key,
    required this.text,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: style ?? const TextStyle(
        fontSize: AppTheme.fontSizeLg,
        fontWeight: AppTheme.fontWeightSemibold,
        color: AppTheme.foreground,
      ),
    );
  }
}

class CardDescription extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const CardDescription({
    super.key,
    required this.text,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: style ?? const TextStyle(
        fontSize: AppTheme.fontSizeSm,
        color: AppTheme.mutedForeground,
      ),
    );
  }
}

class CardContent extends StatelessWidget {
  final Widget? child;
  final EdgeInsets? padding;

  const CardContent({
    super.key,
    this.child,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: AppTheme.spacingMd),
      child: child,
    );
  }
}

class CardFooter extends StatelessWidget {
  final Widget? child;
  final EdgeInsets? padding;

  const CardFooter({
    super.key,
    this.child,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(AppTheme.spacingMd),
      child: child,
    );
  }
}
