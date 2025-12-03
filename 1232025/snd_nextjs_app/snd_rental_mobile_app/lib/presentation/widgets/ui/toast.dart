import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

enum ToastType {
  success,
  error,
  warning,
  info,
}

class Toast extends StatelessWidget {
  final String message;
  final ToastType type;
  final Duration duration;
  final VoidCallback? onDismiss;
  final IconData? icon;

  const Toast({
    super.key,
    required this.message,
    this.type = ToastType.info,
    this.duration = const Duration(seconds: 3),
    this.onDismiss,
    this.icon,
  });

  const Toast.success({
    super.key,
    required this.message,
    this.duration = const Duration(seconds: 3),
    this.onDismiss,
  }) : type = ToastType.success,
       icon = Icons.check_circle;

  const Toast.error({
    super.key,
    required this.message,
    this.duration = const Duration(seconds: 3),
    this.onDismiss,
  }) : type = ToastType.error,
       icon = Icons.error;

  const Toast.warning({
    super.key,
    required this.message,
    this.duration = const Duration(seconds: 3),
    this.onDismiss,
  }) : type = ToastType.warning,
       icon = Icons.warning;

  const Toast.info({
    super.key,
    required this.message,
    this.duration = const Duration(seconds: 3),
    this.onDismiss,
  }) : type = ToastType.info,
       icon = Icons.info;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppTheme.spacingMd),
      padding: const EdgeInsets.all(AppTheme.spacingMd),
      decoration: BoxDecoration(
        color: _getBackgroundColor(),
        borderRadius: BorderRadius.circular(AppTheme.radius),
        border: Border.all(
          color: _getBorderColor(),
          width: 1,
        ),
        boxShadow: AppTheme.shadowMd,
      ),
      child: Row(
        children: [
          Icon(
            icon ?? _getDefaultIcon(),
            size: 20,
            color: _getIconColor(),
          ),
          const SizedBox(width: AppTheme.spacingSm),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: AppTheme.fontSizeSm,
                color: _getTextColor(),
                fontWeight: AppTheme.fontWeightMedium,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(
              Icons.close,
              size: 16,
              color: AppTheme.mutedForeground,
            ),
            onPressed: onDismiss,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(
              minWidth: 24,
              minHeight: 24,
            ),
          ),
        ],
      ),
    );
  }

  Color _getBackgroundColor() {
    switch (type) {
      case ToastType.success:
        return AppTheme.success.withValues(alpha: 0.1);
      case ToastType.error:
        return AppTheme.destructive.withValues(alpha: 0.1);
      case ToastType.warning:
        return AppTheme.warning.withValues(alpha: 0.1);
      case ToastType.info:
        return AppTheme.info.withValues(alpha: 0.1);
    }
  }

  Color _getBorderColor() {
    switch (type) {
      case ToastType.success:
        return AppTheme.success;
      case ToastType.error:
        return AppTheme.destructive;
      case ToastType.warning:
        return AppTheme.warning;
      case ToastType.info:
        return AppTheme.info;
    }
  }

  Color _getIconColor() {
    switch (type) {
      case ToastType.success:
        return AppTheme.success;
      case ToastType.error:
        return AppTheme.destructive;
      case ToastType.warning:
        return AppTheme.warning;
      case ToastType.info:
        return AppTheme.info;
    }
  }

  Color _getTextColor() {
    switch (type) {
      case ToastType.success:
        return AppTheme.success;
      case ToastType.error:
        return AppTheme.destructive;
      case ToastType.warning:
        return AppTheme.warning;
      case ToastType.info:
        return AppTheme.info;
    }
  }

  IconData _getDefaultIcon() {
    switch (type) {
      case ToastType.success:
        return Icons.check_circle;
      case ToastType.error:
        return Icons.error;
      case ToastType.warning:
        return Icons.warning;
      case ToastType.info:
        return Icons.info;
    }
  }
}

class ToastOverlay extends StatefulWidget {
  final List<ToastData> toasts;

  const ToastOverlay({
    super.key,
    required this.toasts,
  });

  @override
  State<ToastOverlay> createState() => _ToastOverlayState();
}

class _ToastOverlayState extends State<ToastOverlay> {
  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + AppTheme.spacingMd,
      left: 0,
      right: 0,
      child: Column(
        children: widget.toasts.map((toast) => Padding(
          padding: const EdgeInsets.only(bottom: AppTheme.spacingSm),
          child: Toast(
            message: toast.message,
            type: toast.type,
            onDismiss: toast.onDismiss,
            icon: toast.icon,
          ),
        )).toList(),
      ),
    );
  }
}

class ToastData {
  final String message;
  final ToastType type;
  final VoidCallback? onDismiss;
  final IconData? icon;

  const ToastData({
    required this.message,
    required this.type,
    this.onDismiss,
    this.icon,
  });
}

// Utility class for showing toasts
class ToastUtils {
  static final List<ToastData> _toasts = [];
  static OverlayEntry? _overlayEntry;

  static void show({
    required BuildContext context,
    required String message,
    ToastType type = ToastType.info,
    Duration duration = const Duration(seconds: 3),
    IconData? icon,
  }) {
    final toastData = ToastData(
      message: message,
      type: type,
      icon: icon,
    );

    _toasts.add(toastData);
    _showOverlay(context);

    // Auto dismiss after duration
    Future.delayed(duration, () {
      _removeToast(toastData);
    });
  }

  static void showSuccess({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    show(
      context: context,
      message: message,
      type: ToastType.success,
      duration: duration,
    );
  }

  static void showError({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    show(
      context: context,
      message: message,
      type: ToastType.error,
      duration: duration,
    );
  }

  static void showWarning({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    show(
      context: context,
      message: message,
      type: ToastType.warning,
      duration: duration,
    );
  }

  static void showInfo({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    show(
      context: context,
      message: message,
      type: ToastType.info,
      duration: duration,
    );
  }

  static void _showOverlay(BuildContext context) {
    if (_overlayEntry != null) {
      _overlayEntry!.remove();
    }

    _overlayEntry = OverlayEntry(
      builder: (context) => ToastOverlay(toasts: _toasts),
    );

    Overlay.of(context).insert(_overlayEntry!);
  }

  static void _removeToast(ToastData toastData) {
    _toasts.remove(toastData);
    if (_toasts.isEmpty && _overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
    } else if (_overlayEntry != null) {
      _overlayEntry!.markNeedsBuild();
    }
  }

  static void clear() {
    _toasts.clear();
    if (_overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
    }
  }
}
