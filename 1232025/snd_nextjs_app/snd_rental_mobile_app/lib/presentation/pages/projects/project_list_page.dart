import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/project_provider.dart';
import '../../widgets/project_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;

class ProjectListPage extends StatefulWidget {
  const ProjectListPage({super.key});

  @override
  State<ProjectListPage> createState() => _ProjectListPageState();
}

class _ProjectListPageState extends State<ProjectListPage> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().loadProjects();
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
      context.read<ProjectProvider>().loadMoreProjects();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              context.read<ProjectProvider>().refreshProjects();
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // TODO: Navigate to add project page
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Add project feature coming soon')),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search and Filter Section
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search projects...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              context.read<ProjectProvider>().searchProjects('');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onChanged: (value) {
                    context.read<ProjectProvider>().searchProjects(value);
                  },
                ),
                const SizedBox(height: 12),
                
                // Filter Chips
                Consumer<ProjectProvider>(
                  builder: (context, provider, child) {
                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          FilterChip(
                            label: const Text('All'),
                            selected: provider.statusFilter == null,
                            onSelected: (selected) {
                              if (selected) {
                                provider.filterByStatus(null);
                              }
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Active'),
                            selected: provider.statusFilter == 'active',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'active' : null);
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('Completed'),
                            selected: provider.statusFilter == 'completed',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'completed' : null);
                            },
                          ),
                          const SizedBox(width: 8),
                          FilterChip(
                            label: const Text('On Hold'),
                            selected: provider.statusFilter == 'on_hold',
                            onSelected: (selected) {
                              provider.filterByStatus(selected ? 'on_hold' : null);
                            },
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          
          // Project List
          Expanded(
            child: Consumer<ProjectProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading && provider.projects.isEmpty) {
                  return const LoadingWidget();
                }

                if (provider.error != null && provider.projects.isEmpty) {
                  return custom.ErrorWidget(
                    message: provider.error!,
                    onRetry: () {
                      provider.refreshProjects();
                    },
                  );
                }

                if (provider.projects.isEmpty) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.work_outline, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'No projects found',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Create your first project to get started',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    provider.refreshProjects();
                  },
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: provider.projects.length + (provider.hasMoreData ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= provider.projects.length) {
                        return const Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      }

                      final project = provider.projects[index];
                      return ProjectCard(
                        project: project,
                        onTap: () {
                          // TODO: Navigate to project details
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Project details: ${project.name}')),
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
}
