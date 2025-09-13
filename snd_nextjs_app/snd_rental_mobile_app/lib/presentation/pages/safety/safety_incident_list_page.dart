import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/safety_incident_provider.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;
import '../../../core/theme/app_theme.dart';

class SafetyIncidentListPage extends StatefulWidget {
  const SafetyIncidentListPage({super.key});

  @override
  State<SafetyIncidentListPage> createState() => _SafetyIncidentListPageState();
}

class _SafetyIncidentListPageState extends State<SafetyIncidentListPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SafetyIncidentProvider>().loadIncidents(refresh: true);
    });
    
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<SafetyIncidentProvider>().loadMoreIncidents();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Safety Incidents'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<SafetyIncidentProvider>().refreshIncidents();
            },
          ),
        ],
      ),
      body: Consumer<SafetyIncidentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.incidents.isEmpty) {
            return const Center(child: LoadingWidget());
          }

          if (provider.hasError) {
            return Center(
              child: custom.ErrorWidget(
                message: provider.errorMessage ?? 'Unknown error',
                onRetry: () => provider.loadIncidents(refresh: true),
              ),
            );
          }

          if (provider.incidents.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.security,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No safety incidents found',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Safety incidents will appear here',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.refreshIncidents(),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: provider.incidents.length + (provider.isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= provider.incidents.length) {
                  return const Padding(
                    padding: EdgeInsets.all(20),
                    child: LoadingWidget(),
                  );
                }

                final incident = provider.incidents[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getSeverityColor(incident.severity),
                      child: Icon(
                        Icons.warning,
                        color: Colors.white,
                      ),
                    ),
                    title: Text(
                      incident.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Location: ${incident.location}'),
                        if (incident.employeeName != null)
                          Text('Employee: ${incident.employeeName}'),
                        Text('Date: ${incident.incidentDate}'),
                        Text('Status: ${incident.status.toUpperCase()}'),
                      ],
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _buildSeverityChip(incident.severity),
                        const SizedBox(height: 4),
                        _buildStatusChip(incident.status),
                      ],
                    ),
                    onTap: () {
                      // Navigate to incident details
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to add incident
        },
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'low':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'high':
        return Colors.red;
      case 'critical':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'open':
        return Colors.red;
      case 'investigating':
        return Colors.orange;
      case 'resolved':
        return Colors.green;
      case 'closed':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  Widget _buildSeverityChip(String severity) {
    final color = _getSeverityColor(severity);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color),
      ),
      child: Text(
        severity.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    final color = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
