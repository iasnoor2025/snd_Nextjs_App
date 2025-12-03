import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import 'button.dart';

class Dialog extends StatelessWidget {
  final String? title;
  final String? description;
  final Widget? content;
  final List<Widget>? actions;
  final bool showCloseButton;
  final VoidCallback? onClose;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;
  final String? confirmText;
  final String? cancelText;
  final bool? isDestructive;

  const Dialog({
    super.key,
    this.title,
    this.description,
    this.content,
    this.actions,
    this.showCloseButton = true,
    this.onClose,
    this.onConfirm,
    this.onCancel,
    this.confirmText,
    this.cancelText,
    this.isDestructive,
  });

  const Dialog.confirm({
    super.key,
    required this.title,
    required this.description,
    required this.onConfirm,
    this.onCancel,
    this.confirmText = 'Confirm',
    this.cancelText = 'Cancel',
    this.isDestructive = false,
  }) : content = null,
       actions = null,
       showCloseButton = false,
       onClose = null;

  const Dialog.alert({
    super.key,
    required this.title,
    required this.description,
    this.confirmText = 'OK',
    this.onConfirm,
  }) : content = null,
       actions = null,
       showCloseButton = false,
       onClose = null,
       onCancel = null,
       cancelText = null,
       isDestructive = false;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(AppTheme.spacingLg),
          decoration: BoxDecoration(
            color: AppTheme.card,
            borderRadius: BorderRadius.circular(AppTheme.radiusLg),
            boxShadow: AppTheme.shadowLg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (title != null || showCloseButton) ...[
                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingLg),
                  child: Row(
                    children: [
                      if (title != null) ...[
                        Expanded(
                          child: Text(
                            title!,
                            style: const TextStyle(
                              fontSize: AppTheme.fontSizeLg,
                              fontWeight: AppTheme.fontWeightSemibold,
                              color: AppTheme.foreground,
                            ),
                          ),
                        ),
                      ] else ...[
                        const Spacer(),
                      ],
                      if (showCloseButton) ...[
                        IconButton(
                          icon: const Icon(
                            Icons.close,
                            size: 20,
                            color: AppTheme.mutedForeground,
                          ),
                          onPressed: onClose ?? () => Navigator.of(context).pop(),
                        ),
                      ],
                    ],
                  ),
                ),
                if (description != null) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
                    child: Text(
                      description!,
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeSm,
                        color: AppTheme.mutedForeground,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacingLg),
                ],
              ],
              if (content != null) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
                  child: content!,
                ),
                const SizedBox(height: AppTheme.spacingLg),
              ],
              if (actions != null) ...[
                Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingLg),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: actions!,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class ConfirmDialog extends StatelessWidget {
  final String title;
  final String description;
  final VoidCallback onConfirm;
  final VoidCallback? onCancel;
  final String confirmText;
  final String cancelText;
  final bool isDestructive;

  const ConfirmDialog({
    super.key,
    required this.title,
    required this.description,
    required this.onConfirm,
    this.onCancel,
    this.confirmText = 'Confirm',
    this.cancelText = 'Cancel',
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      title: title,
      description: description,
      actions: [
        Button.outline(
          text: cancelText,
          onPressed: onCancel ?? () => Navigator.of(context).pop(),
        ),
        const SizedBox(width: AppTheme.spacingSm),
        Button(
          text: confirmText,
          variant: isDestructive ? ButtonVariant.destructive : ButtonVariant.default_,
          onPressed: () {
            Navigator.of(context).pop();
            onConfirm();
          },
        ),
      ],
    );
  }
}

class AlertDialog extends StatelessWidget {
  final String title;
  final String description;
  final String buttonText;
  final VoidCallback? onOk;

  const AlertDialog({
    super.key,
    required this.title,
    required this.description,
    this.buttonText = 'OK',
    this.onOk,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      title: title,
      description: description,
      actions: [
        Button(
          text: buttonText,
          onPressed: () {
            Navigator.of(context).pop();
            onOk?.call();
          },
        ),
      ],
    );
  }
}

class LoadingDialog extends StatelessWidget {
  final String? message;

  const LoadingDialog({
    super.key,
    this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          if (message != null) ...[
            const SizedBox(height: AppTheme.spacingMd),
            Text(
              message!,
              style: const TextStyle(
                fontSize: AppTheme.fontSizeSm,
                color: AppTheme.mutedForeground,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }
}

// Utility functions for showing dialogs
class DialogUtils {
  static Future<T?> showDialog<T>({
    required BuildContext context,
    required Widget dialog,
    bool barrierDismissible = true,
  }) {
    return showGeneralDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      barrierLabel: '',
      barrierColor: Colors.black.withValues(alpha: 0.5),
      transitionDuration: const Duration(milliseconds: 200),
      pageBuilder: (context, animation, secondaryAnimation) => dialog,
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      },
    );
  }

  static Future<bool?> showConfirmDialog({
    required BuildContext context,
    required String title,
    required String description,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
    bool isDestructive = false,
  }) {
    return showDialog<bool>(
      context: context,
      dialog: ConfirmDialog(
        title: title,
        description: description,
        confirmText: confirmText,
        cancelText: cancelText,
        isDestructive: isDestructive,
        onConfirm: () {},
      ),
    );
  }

  static Future<void> showAlertDialog({
    required BuildContext context,
    required String title,
    required String description,
    String buttonText = 'OK',
  }) {
    return showDialog(
      context: context,
      dialog: AlertDialog(
        title: title,
        description: description,
        buttonText: buttonText,
      ),
    );
  }

  static Future<void> showLoadingDialog({
    required BuildContext context,
    String? message,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      dialog: LoadingDialog(message: message),
    );
  }
}
