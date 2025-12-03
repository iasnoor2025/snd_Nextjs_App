import 'package:flutter/material.dart';

class AppTheme {
  // Color palette inspired by shadcn/ui
  static const Color primary = Color(0xFF0F172A);
  static const Color primaryForeground = Color(0xFFF8FAFC);
  static const Color secondary = Color(0xFFF1F5F9);
  static const Color secondaryForeground = Color(0xFF0F172A);
  static const Color muted = Color(0xFFF1F5F9);
  static const Color mutedForeground = Color(0xFF64748B);
  static const Color accent = Color(0xFFF1F5F9);
  static const Color accentForeground = Color(0xFF0F172A);
  static const Color destructive = Color(0xFFEF4444);
  static const Color destructiveForeground = Color(0xFFF8FAFC);
  static const Color border = Color(0xFFE2E8F0);
  static const Color input = Color(0xFFE2E8F0);
  static const Color ring = Color(0xFF0F172A);
  static const Color background = Color(0xFFFFFFFF);
  static const Color foreground = Color(0xFF0F172A);
  static const Color card = Color(0xFFFFFFFF);
  static const Color cardForeground = Color(0xFF0F172A);
  static const Color popover = Color(0xFFFFFFFF);
  static const Color popoverForeground = Color(0xFF0F172A);

  // Success, Warning, Info colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Border radius values
  static const double radiusSm = 4.0;
  static const double radius = 6.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 12.0;
  static const double radiusXl = 16.0;

  // Spacing values
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacing = 12.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 20.0;
  static const double spacingXl = 24.0;
  static const double spacing2xl = 32.0;

  // Font sizes
  static const double fontSizeXs = 12.0;
  static const double fontSizeSm = 14.0;
  static const double fontSizeBase = 16.0;
  static const double fontSizeLg = 18.0;
  static const double fontSizeXl = 20.0;
  static const double fontSize2xl = 24.0;
  static const double fontSize3xl = 30.0;

  // Font weights
  static const FontWeight fontWeightNormal = FontWeight.w400;
  static const FontWeight fontWeightMedium = FontWeight.w500;
  static const FontWeight fontWeightSemibold = FontWeight.w600;
  static const FontWeight fontWeightBold = FontWeight.w700;

  // Line heights
  static const double lineHeightTight = 1.25;
  static const double lineHeightNormal = 1.5;
  static const double lineHeightRelaxed = 1.75;

  // Shadows
  static List<BoxShadow> get shadowSm => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 2,
      offset: const Offset(0, 1),
    ),
  ];

  static List<BoxShadow> get shadow => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.1),
      blurRadius: 4,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> get shadowMd => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.1),
      blurRadius: 8,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> get shadowLg => [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.15),
      blurRadius: 16,
      offset: const Offset(0, 8),
    ),
  ];

  // Theme data
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        brightness: Brightness.light,
        primary: primary,
        onPrimary: primaryForeground,
        secondary: secondary,
        onSecondary: secondaryForeground,
        surface: background,
        onSurface: foreground,
        error: destructive,
        onError: destructiveForeground,
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: fontSize3xl,
          fontWeight: fontWeightBold,
          color: foreground,
          height: lineHeightTight,
        ),
        displayMedium: TextStyle(
          fontSize: fontSize2xl,
          fontWeight: fontWeightBold,
          color: foreground,
          height: lineHeightTight,
        ),
        displaySmall: TextStyle(
          fontSize: fontSizeXl,
          fontWeight: fontWeightSemibold,
          color: foreground,
          height: lineHeightTight,
        ),
        headlineLarge: TextStyle(
          fontSize: fontSizeLg,
          fontWeight: fontWeightSemibold,
          color: foreground,
          height: lineHeightNormal,
        ),
        headlineMedium: TextStyle(
          fontSize: fontSizeBase,
          fontWeight: fontWeightMedium,
          color: foreground,
          height: lineHeightNormal,
        ),
        headlineSmall: TextStyle(
          fontSize: fontSizeSm,
          fontWeight: fontWeightMedium,
          color: foreground,
          height: lineHeightNormal,
        ),
        bodyLarge: TextStyle(
          fontSize: fontSizeBase,
          fontWeight: fontWeightNormal,
          color: foreground,
          height: lineHeightNormal,
        ),
        bodyMedium: TextStyle(
          fontSize: fontSizeSm,
          fontWeight: fontWeightNormal,
          color: foreground,
          height: lineHeightNormal,
        ),
        bodySmall: TextStyle(
          fontSize: fontSizeXs,
          fontWeight: fontWeightNormal,
          color: mutedForeground,
          height: lineHeightNormal,
        ),
        labelLarge: TextStyle(
          fontSize: fontSizeSm,
          fontWeight: fontWeightMedium,
          color: foreground,
          height: lineHeightNormal,
        ),
        labelMedium: TextStyle(
          fontSize: fontSizeXs,
          fontWeight: fontWeightMedium,
          color: foreground,
          height: lineHeightNormal,
        ),
        labelSmall: TextStyle(
          fontSize: fontSizeXs,
          fontWeight: fontWeightNormal,
          color: mutedForeground,
          height: lineHeightNormal,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: primaryForeground,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingMd,
            vertical: spacingSm,
          ),
          textStyle: const TextStyle(
            fontSize: fontSizeSm,
            fontWeight: fontWeightMedium,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingMd,
            vertical: spacingSm,
          ),
          textStyle: const TextStyle(
            fontSize: fontSizeSm,
            fontWeight: fontWeightMedium,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: spacingMd,
            vertical: spacingSm,
          ),
          textStyle: const TextStyle(
            fontSize: fontSizeSm,
            fontWeight: fontWeightMedium,
          ),
        ),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusLg),
          side: const BorderSide(color: border),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: input),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: input),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: ring, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radius),
          borderSide: const BorderSide(color: destructive),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: spacingMd,
          vertical: spacingSm,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        foregroundColor: foreground,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontSize: fontSizeLg,
          fontWeight: fontWeightSemibold,
          color: foreground,
        ),
      ),
      scaffoldBackgroundColor: background,
    );
  }
}
