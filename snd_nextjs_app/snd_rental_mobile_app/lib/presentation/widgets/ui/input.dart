import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

enum InputVariant {
  default_,
  error,
  success,
}

class Input extends StatelessWidget {
  final String? label;
  final String? hint;
  final String? errorText;
  final String? helperText;
  final InputVariant variant;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final int? maxLines;
  final int? maxLength;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final FormFieldValidator<String>? validator;
  final FocusNode? focusNode;
  final EdgeInsets? padding;

  const Input({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.variant = InputVariant.default_,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.controller,
    this.keyboardType,
    this.maxLines = 1,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.focusNode,
    this.padding,
  });

  const Input.password({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.variant = InputVariant.default_,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.controller,
    this.maxLength,
    this.prefixIcon,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.focusNode,
    this.padding,
  }) : keyboardType = TextInputType.visiblePassword,
       suffixIcon = null,
       maxLines = 1;

  const Input.email({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.variant = InputVariant.default_,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.controller,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.focusNode,
    this.padding,
  }) : keyboardType = TextInputType.emailAddress,
       maxLines = 1;

  const Input.multiline({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.variant = InputVariant.default_,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.controller,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.focusNode,
    this.padding,
  }) : keyboardType = TextInputType.multiline,
       maxLines = 3;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Row(
            children: [
              Text(
                label!,
                style: const TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  fontWeight: AppTheme.fontWeightMedium,
                  color: AppTheme.foreground,
                ),
              ),
              if (isRequired) ...[
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
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          maxLength: maxLength,
          focusNode: focusNode,
          readOnly: isReadOnly,
          enabled: !isDisabled,
          onTap: onTap,
          onChanged: onChanged,
          onFieldSubmitted: onSubmitted,
          validator: validator,
          style: TextStyle(
            fontSize: AppTheme.fontSizeSm,
            color: isDisabled ? AppTheme.mutedForeground : AppTheme.foreground,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: AppTheme.fontSizeSm,
            ),
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
            errorText: errorText,
            helperText: helperText,
            helperStyle: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: AppTheme.fontSizeXs,
            ),
            errorStyle: const TextStyle(
              color: AppTheme.destructive,
              fontSize: AppTheme.fontSizeXs,
            ),
            filled: true,
            fillColor: isDisabled ? AppTheme.muted : AppTheme.background,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: BorderSide(
                color: _getBorderColor(),
                width: 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: BorderSide(
                color: _getBorderColor(),
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: BorderSide(
                color: _getFocusedBorderColor(),
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(
                color: AppTheme.destructive,
                width: 1,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(
                color: AppTheme.destructive,
                width: 2,
              ),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: BorderSide(
                color: AppTheme.border.withValues(alpha: 0.5),
                width: 1,
              ),
            ),
            contentPadding: padding ?? const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingSm,
            ),
            counterText: '',
          ),
        ),
      ],
    );
  }

  Color _getBorderColor() {
    switch (variant) {
      case InputVariant.default_:
        return AppTheme.border;
      case InputVariant.error:
        return AppTheme.destructive;
      case InputVariant.success:
        return AppTheme.success;
    }
  }

  Color _getFocusedBorderColor() {
    switch (variant) {
      case InputVariant.default_:
        return AppTheme.ring;
      case InputVariant.error:
        return AppTheme.destructive;
      case InputVariant.success:
        return AppTheme.success;
    }
  }
}

class PasswordInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? errorText;
  final String? helperText;
  final InputVariant variant;
  final bool isRequired;
  final bool isDisabled;
  final bool isReadOnly;
  final TextEditingController? controller;
  final int? maxLength;
  final Widget? prefixIcon;
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final FormFieldValidator<String>? validator;
  final FocusNode? focusNode;
  final EdgeInsets? padding;

  const PasswordInput({
    super.key,
    this.label,
    this.hint,
    this.errorText,
    this.helperText,
    this.variant = InputVariant.default_,
    this.isRequired = false,
    this.isDisabled = false,
    this.isReadOnly = false,
    this.controller,
    this.maxLength,
    this.prefixIcon,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.focusNode,
    this.padding,
  });

  @override
  State<PasswordInput> createState() => _PasswordInputState();
}

class _PasswordInputState extends State<PasswordInput> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Input(
      label: widget.label,
      hint: widget.hint,
      errorText: widget.errorText,
      helperText: widget.helperText,
      variant: widget.variant,
      isRequired: widget.isRequired,
      isDisabled: widget.isDisabled,
      isReadOnly: widget.isReadOnly,
      controller: widget.controller,
      keyboardType: TextInputType.visiblePassword,
      maxLength: widget.maxLength,
      prefixIcon: widget.prefixIcon,
      suffixIcon: IconButton(
        icon: Icon(
          _obscureText ? Icons.visibility_off : Icons.visibility,
          size: 20,
          color: AppTheme.mutedForeground,
        ),
        onPressed: () {
          setState(() {
            _obscureText = !_obscureText;
          });
        },
      ),
      onTap: widget.onTap,
      onChanged: widget.onChanged,
      onSubmitted: widget.onSubmitted,
      validator: widget.validator,
      focusNode: widget.focusNode,
      padding: widget.padding,
    );
  }
}