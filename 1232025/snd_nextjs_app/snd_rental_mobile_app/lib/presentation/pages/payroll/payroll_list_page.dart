import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/payroll_provider.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;
import '../../../core/theme/app_theme.dart';

class PayrollListPage extends StatefulWidget {
  const PayrollListPage({super.key});

  @override
  State<PayrollListPage> createState() => _PayrollListPageState();
}

class _PayrollListPageState extends State<PayrollListPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PayrollProvider>().loadPayrolls(refresh: true);
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
      context.read<PayrollProvider>().loadMorePayrolls();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Payroll Management'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<PayrollProvider>().refreshPayrolls();
            },
          ),
        ],
      ),
      body: Consumer<PayrollProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.payrolls.isEmpty) {
            return const Center(child: LoadingWidget());
          }

          if (provider.hasError) {
            return Center(
              child: custom.ErrorWidget(
                message: provider.errorMessage ?? 'Unknown error',
                onRetry: () => provider.loadPayrolls(refresh: true),
              ),
            );
          }

          if (provider.payrolls.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.payment,
                    size: 64,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No payroll records found',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Payroll records will appear here',
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
            onRefresh: () => provider.refreshPayrolls(),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: provider.payrolls.length + (provider.isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index >= provider.payrolls.length) {
                  return const Padding(
                    padding: EdgeInsets.all(20),
                    child: LoadingWidget(),
                  );
                }

                final payroll = provider.payrolls[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getStatusColor(payroll.status),
                      child: const Icon(
                        Icons.payment,
                        color: Colors.white,
                      ),
                    ),
                    title: Text(
                      payroll.employeeName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Period: ${payroll.period}'),
                        Text('Status: ${payroll.status.toUpperCase()}'),
                        Text('Net Salary: ${payroll.netSalary.toStringAsFixed(2)} SAR'),
                      ],
                    ),
                    trailing: _buildStatusChip(payroll.status),
                    onTap: () {
                      // Navigate to payroll details
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
          // Navigate to add payroll
        },
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.green;
      case 'processed':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  Widget _buildStatusChip(String status) {
    final color = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
