import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class DropdownItem<T> {
  final T value;
  final String label;
  final String? description;
  final IconData? icon;
  final bool isDisabled;

  const DropdownItem({
    required this.value,
    required this.label,
    this.description,
    this.icon,
    this.isDisabled = false,
  });
}

class Dropdown<T> extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? errorText;
  final String? helperText;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;
  final T? value;
  final List<DropdownItem<T>> items;
  final ValueChanged<T?>? onChanged;
  final FormFieldValidator<T>? validator;
  final Widget? prefixIcon;
  final EdgeInsets? padding;

  const Dropdown({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.value,
    required this.items,
    this.onChanged,
    this.validator,
    this.prefixIcon,
    this.padding,
  });

  @override
  State<Dropdown<T>> createState() => _DropdownState<T>();
}

class _DropdownState<T> extends State<Dropdown<T>> {
  T? _selectedValue;

  @override
  void initState() {
    super.initState();
    _selectedValue = widget.value;
  }

  @override
  void didUpdateWidget(Dropdown<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != oldWidget.value) {
      _selectedValue = widget.value;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Row(
            children: [
              Text(
                widget.label!,
                style: const TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  fontWeight: AppTheme.fontWeightMedium,
                  color: AppTheme.foreground,
                ),
              ),
              if (widget.isRequired) ...[
                const SizedBox(width: AppTheme.spacingXs),
                const Text(
                  '*',
                  style: TextStyle(
                    color: AppTheme.destructive,
                    fontSize: AppTheme.fontSizeSm,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: AppTheme.spacingXs),
        ],
        DropdownButtonFormField<T>(
          initialValue: _selectedValue,
          items: widget.items.map((item) => DropdownMenuItem<T>(
            value: item.value,
            enabled: !item.isDisabled,
            child: Row(
              children: [
                if (item.icon != null) ...[
                  Icon(
                    item.icon,
                    size: 16,
                    color: item.isDisabled ? AppTheme.mutedForeground : AppTheme.foreground,
                  ),
                  const SizedBox(width: AppTheme.spacingSm),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: AppTheme.fontSizeSm,
                          color: item.isDisabled ? AppTheme.mutedForeground : AppTheme.foreground,
                        ),
                      ),
                      if (item.description != null) ...[
                        Text(
                          item.description!,
                          style: const TextStyle(
                            fontSize: AppTheme.fontSizeXs,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          )).toList(),
          onChanged: widget.isDisabled || widget.isReadOnly ? null : (value) {
            setState(() {
              _selectedValue = value;
            });
            widget.onChanged?.call(value);
          },
          validator: widget.validator,
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: AppTheme.fontSizeSm,
            ),
            prefixIcon: widget.prefixIcon,
            errorText: widget.errorText,
            helperText: widget.helperText,
            helperStyle: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: AppTheme.fontSizeXs,
            ),
            errorStyle: const TextStyle(
              color: AppTheme.destructive,
              fontSize: AppTheme.fontSizeXs,
            ),
            filled: true,
            fillColor: widget.isDisabled ? AppTheme.muted : AppTheme.background,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(color: AppTheme.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(color: AppTheme.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(color: AppTheme.ring, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(color: AppTheme.destructive),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(color: AppTheme.destructive, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: BorderSide(
                color: AppTheme.border.withValues(alpha: 0.5),
              ),
            ),
            contentPadding: widget.padding ?? const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingSm,
            ),
          ),
        ),
      ],
    );
  }
}

class MultiSelectDropdown<T> extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? errorText;
  final String? helperText;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;
  final List<T> values;
  final List<DropdownItem<T>> items;
  final ValueChanged<List<T>>? onChanged;
  final FormFieldValidator<List<T>>? validator;
  final Widget? prefixIcon;
  final EdgeInsets? padding;

  const MultiSelectDropdown({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    required this.values,
    required this.items,
    this.onChanged,
    this.validator,
    this.prefixIcon,
    this.padding,
  });

  @override
  State<MultiSelectDropdown<T>> createState() => _MultiSelectDropdownState<T>();
}

class _MultiSelectDropdownState<T> extends State<MultiSelectDropdown<T>> {
  List<T> _selectedValues = [];

  @override
  void initState() {
    super.initState();
    _selectedValues = List.from(widget.values);
  }

  @override
  void didUpdateWidget(MultiSelectDropdown<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.values != oldWidget.values) {
      _selectedValues = List.from(widget.values);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Row(
            children: [
              Text(
                widget.label!,
                style: const TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  fontWeight: AppTheme.fontWeightMedium,
                  color: AppTheme.foreground,
                ),
              ),
              if (widget.isRequired) ...[
                const SizedBox(width: AppTheme.spacingXs),
                const Text(
                  '*',
                  style: TextStyle(
                    color: AppTheme.destructive,
                    fontSize: AppTheme.fontSizeSm,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: AppTheme.spacingXs),
        ],
        InkWell(
          onTap: widget.isDisabled || widget.isReadOnly ? null : _showMultiSelectDialog,
          child: Container(
            padding: widget.padding ?? const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingSm,
            ),
            decoration: BoxDecoration(
              color: widget.isDisabled ? AppTheme.muted : AppTheme.background,
              border: Border.all(color: AppTheme.border),
              borderRadius: BorderRadius.circular(AppTheme.radius),
            ),
            child: Row(
              children: [
                if (widget.prefixIcon != null) ...[
                  widget.prefixIcon!,
                  const SizedBox(width: AppTheme.spacingSm),
                ],
                Expanded(
                  child: _selectedValues.isEmpty
                      ? Text(
                          widget.hint ?? 'Select items',
                          style: const TextStyle(
                            color: AppTheme.mutedForeground,
                            fontSize: AppTheme.fontSizeSm,
                          ),
                        )
                      : Wrap(
                          spacing: AppTheme.spacingXs,
                          runSpacing: AppTheme.spacingXs,
                          children: _selectedValues.map((value) {
                            final item = widget.items.firstWhere(
                              (item) => item.value == value,
                              orElse: () => DropdownItem(
                                value: value,
                                label: value.toString(),
                              ),
                            );
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppTheme.spacingSm,
                                vertical: AppTheme.spacingXs,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                                border: Border.all(color: AppTheme.primary),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    item.label,
                                    style: const TextStyle(
                                      fontSize: AppTheme.fontSizeXs,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                  const SizedBox(width: AppTheme.spacingXs),
                                  GestureDetector(
                                    onTap: () => _removeValue(value),
                                    child: const Icon(
                                      Icons.close,
                                      size: 12,
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                ),
                const Icon(
                  Icons.arrow_drop_down,
                  color: AppTheme.mutedForeground,
                ),
              ],
            ),
          ),
        ),
        if (widget.errorText != null) ...[
          const SizedBox(height: AppTheme.spacingXs),
          Text(
            widget.errorText!,
            style: const TextStyle(
              color: AppTheme.destructive,
              fontSize: AppTheme.fontSizeXs,
            ),
          ),
        ],
        if (widget.helperText != null) ...[
          const SizedBox(height: AppTheme.spacingXs),
          Text(
            widget.helperText!,
            style: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: AppTheme.fontSizeXs,
            ),
          ),
        ],
      ],
    );
  }

  void _showMultiSelectDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(widget.label ?? 'Select Items'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: widget.items.length,
            itemBuilder: (context, index) {
              final item = widget.items[index];
              final isSelected = _selectedValues.contains(item.value);
              
              return CheckboxListTile(
                title: Text(item.label),
                subtitle: item.description != null ? Text(item.description!) : null,
                value: isSelected,
                enabled: !item.isDisabled,
                onChanged: (value) {
                  if (value == true) {
                    _addValue(item.value);
                  } else {
                    _removeValue(item.value);
                  }
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              widget.onChanged?.call(_selectedValues);
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _addValue(T value) {
    if (!_selectedValues.contains(value)) {
      setState(() {
        _selectedValues.add(value);
      });
    }
  }

  void _removeValue(T value) {
    setState(() {
      _selectedValues.remove(value);
    });
    widget.onChanged?.call(_selectedValues);
  }
}
