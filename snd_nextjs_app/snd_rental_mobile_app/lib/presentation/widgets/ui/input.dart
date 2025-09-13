import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_theme.dart';

class Input extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? error;
  final String? helperText;
  final TextEditingController? controller;
  final String? initialValue;
  final bool obscureText;
  final bool enabled;
  final bool readOnly;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final int? maxLines;
  final int? maxLength;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final List<TextInputFormatter>? inputFormatters;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final void Function(String)? onSubmitted;
  final void Function()? onTap;
  final FocusNode? focusNode;
  final bool autofocus;

  const Input({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.helperText,
    this.controller,
    this.initialValue,
    this.obscureText = false,
    this.enabled = true,
    this.readOnly = false,
    this.keyboardType,
    this.textInputAction,
    this.maxLines = 1,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.inputFormatters,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.focusNode,
    this.autofocus = false,
  });

  const Input.email({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.helperText,
    this.controller,
    this.initialValue,
    this.enabled = true,
    this.readOnly = false,
    this.textInputAction,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.inputFormatters,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.focusNode,
    this.autofocus = false,
  }) : obscureText = false,
       keyboardType = TextInputType.emailAddress,
       maxLines = 1;

  const Input.password({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.helperText,
    this.controller,
    this.initialValue,
    this.enabled = true,
    this.readOnly = false,
    this.textInputAction,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.inputFormatters,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.focusNode,
    this.autofocus = false,
  }) : obscureText = true,
       keyboardType = TextInputType.visiblePassword,
       maxLines = 1;

  const Input.multiline({
    super.key,
    this.label,
    this.hint,
    this.error,
    this.helperText,
    this.controller,
    this.initialValue,
    this.enabled = true,
    this.readOnly = false,
    this.textInputAction,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.inputFormatters,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.onTap,
    this.focusNode,
    this.autofocus = false,
  }) : obscureText = false,
       keyboardType = TextInputType.multiline,
       maxLines = 3;

  @override
  State<Input> createState() => _InputState();
}

class _InputState extends State<Input> {
  late bool _obscureText;
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
    _controller = widget.controller ?? TextEditingController(text: widget.initialValue);
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: const TextStyle(
              fontSize: AppTheme.fontSizeSm,
              fontWeight: AppTheme.fontWeightMedium,
              color: AppTheme.foreground,
            ),
          ),
          const SizedBox(height: AppTheme.spacingXs),
        ],
        TextFormField(
          controller: _controller,
          obscureText: _obscureText,
          enabled: widget.enabled,
          readOnly: widget.readOnly,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          maxLines: widget.maxLines,
          maxLength: widget.maxLength,
          inputFormatters: widget.inputFormatters,
          validator: widget.validator,
          onChanged: widget.onChanged,
          onFieldSubmitted: widget.onSubmitted,
          onTap: widget.onTap,
          focusNode: widget.focusNode,
          autofocus: widget.autofocus,
          style: TextStyle(
            fontSize: AppTheme.fontSizeBase,
            color: widget.enabled ? AppTheme.foreground : AppTheme.mutedForeground,
          ),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: AppTheme.fontSizeBase,
            ),
            errorText: widget.error,
            helperText: widget.helperText,
            helperStyle: const TextStyle(
              color: AppTheme.mutedForeground,
              fontSize: AppTheme.fontSizeSm,
            ),
            prefixIcon: widget.prefixIcon,
            suffixIcon: widget.suffixIcon ?? _buildPasswordToggle(),
            filled: true,
            fillColor: widget.enabled ? AppTheme.background : AppTheme.muted,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(color: AppTheme.input),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTheme.radius),
              borderSide: const BorderSide(color: AppTheme.input),
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
              borderSide: const BorderSide(color: AppTheme.input),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMd,
              vertical: AppTheme.spacingSm,
            ),
            counterText: '',
          ),
        ),
      ],
    );
  }

  Widget? _buildPasswordToggle() {
    if (!widget.obscureText) return null;

    return IconButton(
      icon: Icon(
        _obscureText ? Icons.visibility_off : Icons.visibility,
        color: AppTheme.mutedForeground,
      ),
      onPressed: () {
        setState(() {
          _obscureText = !_obscureText;
        });
      },
    );
  }
}
