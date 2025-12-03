import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import 'button.dart';

class Sheet extends StatelessWidget {
  final String? title;
  final String? description;
  final Widget? content;
  final List<Widget>? actions;
  final bool showCloseButton;
  final VoidCallback? onClose;
  final double? height;
  final bool isScrollable;

  const Sheet({
    super.key,
    this.title,
    this.description,
    this.content,
    this.actions,
    this.showCloseButton = true,
    this.onClose,
    this.height,
    this.isScrollable = true,
  });

  const Sheet.full({
    super.key,
    this.title,
    this.description,
    this.content,
    this.actions,
    this.showCloseButton = true,
    this.onClose,
  }) : height = null,
       isScrollable = true;

  const Sheet.fixed({
    super.key,
    this.title,
    this.description,
    this.content,
    this.actions,
    this.showCloseButton = true,
    this.onClose,
    required this.height,
  }) : isScrollable = false;

  @override
  Widget build(BuildContext context) {
    Widget sheetContent = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Handle bar
        Container(
          width: 40,
          height: 4,
          margin: const EdgeInsets.only(top: AppTheme.spacingSm),
          decoration: BoxDecoration(
            color: AppTheme.border,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        
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
          if (isScrollable)
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: AppTheme.spacingLg),
                child: content!,
              ),
            )
          else
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
    );

    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: AppTheme.card,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppTheme.radiusLg),
        ),
      ),
      child: isScrollable && height == null
          ? sheetContent
          : SizedBox(
              height: height,
              child: sheetContent,
            ),
    );
  }
}

class ActionSheet extends StatelessWidget {
  final String? title;
  final List<ActionSheetItem> items;
  final String? cancelText;
  final VoidCallback? onCancel;

  const ActionSheet({
    super.key,
    this.title,
    required this.items,
    this.cancelText = 'Cancel',
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    return Sheet(
      title: title,
      content: Column(
        children: items.map((item) => _buildActionItem(context, item)).toList(),
      ),
      actions: [
        Button.outline(
          text: cancelText ?? 'Cancel',
          onPressed: onCancel ?? () => Navigator.of(context).pop(),
        ),
      ],
    );
  }

  Widget _buildActionItem(BuildContext context, ActionSheetItem item) {
    return InkWell(
      onTap: () {
        Navigator.of(context).pop();
        item.onTap();
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: AppTheme.spacingLg,
          vertical: AppTheme.spacingMd,
        ),
        child: Row(
          children: [
            if (item.icon != null) ...[
              Icon(
                item.icon,
                size: 20,
                color: item.isDestructive ? AppTheme.destructive : AppTheme.foreground,
              ),
              const SizedBox(width: AppTheme.spacingMd),
            ],
            Expanded(
              child: Text(
                item.title,
                style: TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  color: item.isDestructive ? AppTheme.destructive : AppTheme.foreground,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ActionSheetItem {
  final String title;
  final IconData? icon;
  final VoidCallback onTap;
  final bool isDestructive;

  const ActionSheetItem({
    required this.title,
    this.icon,
    required this.onTap,
    this.isDestructive = false,
  });
}

// Utility functions for showing sheets
class SheetUtils {
  static Future<T?> showSheet<T>({
    required BuildContext context,
    required Widget sheet,
    bool isDismissible = true,
  }) {
    return showModalBottomSheet<T>(
      context: context,
      isDismissible: isDismissible,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => sheet,
    );
  }

  static Future<T?> showActionSheet<T>({
    required BuildContext context,
    String? title,
    required List<ActionSheetItem> items,
    String? cancelText,
  }) {
    return showSheet<T>(
      context: context,
      sheet: ActionSheet(
        title: title,
        items: items,
        cancelText: cancelText,
      ),
    );
  }
}
