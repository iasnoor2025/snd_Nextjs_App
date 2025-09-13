import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../services/auth_service.dart';
import '../employees/employee_list_page.dart';
import '../projects/project_list_page.dart';
import '../equipment/equipment_list_page.dart';
import '../rentals/rental_list_page.dart';
import '../customers/customer_list_page.dart';
import '../../widgets/dashboard_card.dart';
import '../../providers/employee_provider.dart';
import '../../providers/project_provider.dart';
import '../../providers/equipment_provider.dart';
import '../../providers/rental_provider.dart';
import '../../providers/customer_provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const DashboardTab(),
    const EmployeeListPage(),
    const ProjectListPage(),
    const EquipmentListPage(),
    const RentalListPage(),
    const CustomerListPage(),
    const ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Employees',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.work),
            label: 'Projects',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.build),
            label: 'Equipment',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long),
            label: 'Rentals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.business),
            label: 'Customers',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboardData();
    });
  }

  void _loadDashboardData() {
    context.read<EmployeeProvider>().loadEmployees();
    context.read<ProjectProvider>().loadProjects();
    context.read<EquipmentProvider>().loadEquipment();
    context.read<RentalProvider>().loadRentals();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          ),
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {
              // Handle notifications
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          _loadDashboardData();
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue[400]!, Colors.blue[600]!],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Welcome to SND Rental Management',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Manage your rental business efficiently',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Statistics Section
              const Text(
                'Overview',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              // Statistics Grid
              Consumer2<EmployeeProvider, ProjectProvider>(
                builder: (context, employeeProvider, projectProvider, child) {
                  return Consumer2<EquipmentProvider, RentalProvider>(
                    builder: (context, equipmentProvider, rentalProvider, child) {
                      final employeeStats = employeeProvider.getEmployeeStats();
                      final projectStats = projectProvider.getProjectStats();
                      final equipmentStats = equipmentProvider.getEquipmentStats();
                      final rentalStats = rentalProvider.getRentalStats();
                      
                      return GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                        childAspectRatio: 1.5,
                        children: [
                          DashboardCard(
                            title: 'Total Employees',
                            value: employeeStats['total'].toString(),
                            icon: Icons.people,
                            color: Colors.green,
                            onTap: () {
                              // Navigate to employees tab
                            },
                          ),
                          DashboardCard(
                            title: 'Active Projects',
                            value: projectStats['active'].toString(),
                            icon: Icons.work,
                            color: Colors.blue,
                            onTap: () {
                              // Navigate to projects tab
                            },
                          ),
                          DashboardCard(
                            title: 'Available Equipment',
                            value: equipmentStats['available'].toString(),
                            icon: Icons.build,
                            color: Colors.orange,
                            onTap: () {
                              // Navigate to equipment tab
                            },
                          ),
                          DashboardCard(
                            title: 'Active Rentals',
                            value: rentalStats['active'].toString(),
                            icon: Icons.receipt_long,
                            color: Colors.purple,
                            onTap: () {
                              // Navigate to rentals tab
                            },
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
              
              const SizedBox(height: 24),
              
              // Quick Actions Section
              const Text(
                'Quick Actions',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Navigate to add employee
                      },
                      icon: const Icon(Icons.person_add),
                      label: const Text('Add Employee'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Navigate to add project
                      },
                      icon: const Icon(Icons.add_business),
                      label: const Text('Add Project'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Navigate to add equipment
                      },
                      icon: const Icon(Icons.add_box),
                      label: const Text('Add Equipment'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Navigate to add rental
                      },
                      icon: const Icon(Icons.add_card),
                      label: const Text('Add Rental'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class EmployeesTab extends StatelessWidget {
  const EmployeesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // Handle add employee
            },
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people, size: 64, color: Colors.green),
            SizedBox(height: 16),
            Text(
              'Employee Management',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('Employee list coming soon...'),
          ],
        ),
      ),
    );
  }
}

class ProjectsTab extends StatelessWidget {
  const ProjectsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              // Handle add project
            },
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.work, size: 64, color: Colors.orange),
            SizedBox(height: 16),
            Text(
              'Project Management',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text('Project list coming soon...'),
          ],
        ),
      ),
    );
  }
}

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final authService = context.read<AuthService>();
              await authService.signOut();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
          ),
        ],
      ),
      body: Consumer<AuthService>(
        builder: (context, authService, child) {
          final user = authService.currentUser;
          
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundImage: user?.photoUrl != null
                      ? NetworkImage(user!.photoUrl!)
                      : null,
                  child: user?.photoUrl == null
                      ? const Icon(Icons.person, size: 50)
                      : null,
                ),
                const SizedBox(height: 16),
                Text(
                  user?.displayName ?? 'User',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(user?.email ?? ''),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () async {
                    await authService.signOut();
                    if (context.mounted) {
                      Navigator.of(context).pushReplacementNamed('/login');
                    }
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign Out'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
