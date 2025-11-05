import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/timesheet_provider.dart';
import '../../../data/models/timesheet_model.dart';
import '../../widgets/ui/card.dart' as ui;
import '../../widgets/ui/button.dart';
import '../../widgets/ui/badge.dart' as ui;
import '../../../core/theme/app_theme.dart';
import 'add_timesheet_page.dart';
import 'timesheet_details_page.dart';

class TimesheetListPage extends StatefulWidget {
  final String? employeeId;
  final String? projectId;

  const TimesheetListPage({
    super.key,
    this.employeeId,
    this.projectId,
  });

  @override
  State<TimesheetListPage> createState() => _TimesheetListPageState();
}

class _TimesheetListPageState extends State<TimesheetListPage> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TimesheetProvider>().loadTimesheets(
        employeeId: widget.employeeId,
        projectId: widget.projectId,
      );
    });
    
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      context.read<TimesheetProvider>().loadMoreTimesheets();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.employeeId != null 
            ? 'Employee Timesheets' 
            : 'All Timesheets'),
        backgroundColor: AppTheme.primary,
        foregroundColor: AppTheme.primaryForeground,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => AddTimesheetPage(
                    employeeId: widget.employeeId,
                    projectId: widget.projectId,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.all(AppTheme.spacingMd),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search timesheets...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              context.read<TimesheetProvider>().searchTimesheets('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radius),
                    ),
                  ),
                  onChanged: (value) {
                    context.read<TimesheetProvider>().searchTimesheets(value);
                  },
                ),
                const SizedBox(height: AppTheme.spacingSm),
                
                // Filter Chips
                Consumer<TimesheetProvider>(
                  builder: (context, provider, child) {
                    return Wrap(
                      spacing: AppTheme.spacingXs,
                      children: [
                        _buildFilterChip(
                          'All',
                          provider.statusFilter == null,
                          () => provider.filterByStatus(null),
                        ),
                        _buildFilterChip(
                          'Pending',
                          provider.statusFilter == 'pending',
                          () => provider.filterByStatus('pending'),
                        ),
                        _buildFilterChip(
                          'Approved',
                          provider.statusFilter == 'approved',
                          () => provider.filterByStatus('approved'),
                        ),
                        _buildFilterChip(
                          'Rejected',
                          provider.statusFilter == 'rejected',
                          () => provider.filterByStatus('rejected'),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          
          // Timesheets List
          Expanded(
            child: Consumer<TimesheetProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.timesheets.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                if (provider.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          size: 64,
                          color: AppTheme.destructive,
                        ),
                        const SizedBox(height: AppTheme.spacingMd),
                        Text(
                          provider.errorMessage ?? 'Unknown error',
                          style: const TextStyle(
                            fontSize: AppTheme.fontSizeSm,
                            color: AppTheme.mutedForeground,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppTheme.spacingMd),
                        Button.outline(
                          text: 'Retry',
                          onPressed: () => provider.loadTimesheets(
                            employeeId: widget.employeeId,
                            projectId: widget.projectId,
                          ),
                        ),
                      ],
                    ),
                  );
                }
                
                if (provider.filteredTimesheets.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.access_time,
                          size: 64,
                          color: AppTheme.mutedForeground,
                        ),
                        SizedBox(height: AppTheme.spacingMd),
                        Text(
                          'No timesheets found',
                          style: TextStyle(
                            fontSize: AppTheme.fontSizeLg,
                            fontWeight: AppTheme.fontWeightBold,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                        SizedBox(height: AppTheme.spacingSm),
                        Text(
                          'Add your first timesheet to get started',
                          style: TextStyle(
                            fontSize: AppTheme.fontSizeSm,
                            color: AppTheme.mutedForeground,
                          ),
                        ),
                      ],
                    ),
                  );
                }
                
                return RefreshIndicator(
                  onRefresh: () => provider.refreshTimesheets(),
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(AppTheme.spacingMd),
                    itemCount: provider.filteredTimesheets.length + 
                        (provider.hasMoreData ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= provider.filteredTimesheets.length) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.all(AppTheme.spacingMd),
                            child: CircularProgressIndicator(),
                          ),
                        );
                      }
                      
                      final timesheet = provider.filteredTimesheets[index];
                      return TimesheetCard(
                        timesheet: timesheet,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => TimesheetDetailsPage(
                                timesheet: timesheet,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, bool isSelected, VoidCallback onTap) {
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onTap(),
      backgroundColor: AppTheme.muted,
      selectedColor: AppTheme.primary.withValues(alpha: 0.2),
      checkmarkColor: AppTheme.primary,
      labelStyle: TextStyle(
        color: isSelected ? AppTheme.primary : AppTheme.foreground,
        fontWeight: isSelected ? AppTheme.fontWeightMedium : AppTheme.fontWeightNormal,
      ),
    );
  }
}

class TimesheetCard extends StatelessWidget {
  final TimesheetModel timesheet;
  final VoidCallback? onTap;

  const TimesheetCard({
    super.key,
    required this.timesheet,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ui.UICard.default_(
      margin: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      timesheet.employeeName,
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeSm,
                        fontWeight: AppTheme.fontWeightBold,
                        color: AppTheme.foreground,
                      ),
                    ),
                    if (timesheet.projectName != null)
                      Text(
                        timesheet.projectName!,
                        style: const TextStyle(
                          fontSize: AppTheme.fontSizeSm,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                  ],
                ),
              ),
              ui.Badge(
                text: timesheet.status.toUpperCase(),
                variant: _getStatusVariant(timesheet.status),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingSm),
          
          Row(
            children: [
              const Icon(
                Icons.calendar_today,
                size: 16,
                color: AppTheme.mutedForeground,
              ),
              const SizedBox(width: AppTheme.spacingXs),
              Text(
                timesheet.displayDate,
                style: const TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  color: AppTheme.mutedForeground,
                ),
              ),
              const Spacer(),
              const Icon(
                Icons.access_time,
                size: 16,
                color: AppTheme.mutedForeground,
              ),
              const SizedBox(width: AppTheme.spacingXs),
              Text(
                timesheet.displayTotalHours,
                style: const TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  fontWeight: AppTheme.fontWeightMedium,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
          
          if (timesheet.description != null && timesheet.description!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: AppTheme.spacingSm),
              child: Text(
                timesheet.description!,
                style: const TextStyle(
                  fontSize: AppTheme.fontSizeSm,
                  color: AppTheme.mutedForeground,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
      ),
    );
  }

  ui.BadgeVariant _getStatusVariant(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return ui.BadgeVariant.default_;
      case 'rejected':
        return ui.BadgeVariant.destructive;
      case 'pending':
      default:
        return ui.BadgeVariant.secondary;
    }
  }
}

