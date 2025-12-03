import 'package:flutter/material.dart';

class FilterChipsWidget extends StatelessWidget {
  final List<String> options;
  final List<String> selectedOptions;
  final ValueChanged<List<String>> onSelectionChanged;
  final String? label;

  const FilterChipsWidget({
    super.key,
    required this.options,
    required this.selectedOptions,
    required this.onSelectionChanged,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
        ],
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((option) {
            final isSelected = selectedOptions.contains(option);
            return FilterChip(
              label: Text(option),
              selected: isSelected,
              onSelected: (selected) {
                final newSelection = List<String>.from(selectedOptions);
                if (selected) {
                  if (!newSelection.contains(option)) {
                    newSelection.add(option);
                  }
                } else {
                  newSelection.remove(option);
                }
                onSelectionChanged(newSelection);
              },
            );
          }).toList(),
        ),
      ],
    );
  }
}
