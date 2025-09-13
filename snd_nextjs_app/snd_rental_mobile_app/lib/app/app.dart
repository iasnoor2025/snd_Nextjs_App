import 'package:flutter/material.dart';
// import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import '../core/network/api_client.dart';
import '../core/theme/app_theme.dart';
import '../services/auth_service.dart';
import '../services/login_bridge_service.dart';
import '../presentation/providers/employee_provider.dart';
import '../presentation/providers/project_provider.dart';
import '../presentation/providers/equipment_provider.dart';
import '../presentation/providers/rental_provider.dart';
import '../presentation/providers/timesheet_provider.dart';
import '../presentation/providers/customer_provider.dart';
import '../presentation/providers/document_provider.dart';
import '../presentation/providers/payroll_provider.dart';
import '../presentation/providers/leave_provider.dart';
import '../presentation/providers/quotation_provider.dart';
import '../presentation/providers/safety_incident_provider.dart';
import '../presentation/providers/company_provider.dart';
import '../presentation/providers/user_provider.dart';
import '../presentation/providers/report_provider.dart';
import '../presentation/pages/splash_page.dart';
import '../presentation/pages/auth/login_page.dart';
import '../presentation/pages/home/home_page.dart';

class SndRentalApp extends StatelessWidget {
  const SndRentalApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Initialize Firebase for web
    // Firebase.initializeApp();
    
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => EmployeeProvider()),
        ChangeNotifierProvider(create: (_) => ProjectProvider()),
        ChangeNotifierProvider(create: (_) => EquipmentProvider()),
        ChangeNotifierProvider(create: (_) => RentalProvider()),
        ChangeNotifierProvider(create: (_) => TimesheetProvider()),
        ChangeNotifierProvider(create: (_) => CustomerProvider()),
        ChangeNotifierProvider(create: (_) => DocumentProvider()),
        ChangeNotifierProvider(create: (_) => PayrollProvider()),
        ChangeNotifierProvider(create: (_) => LeaveProvider()),
        ChangeNotifierProvider(create: (_) => QuotationProvider()),
        ChangeNotifierProvider(create: (_) => SafetyIncidentProvider()),
        ChangeNotifierProvider(create: (_) => CompanyProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => ReportProvider()),
      ],
      child: MaterialApp(
        title: 'SND Rental Management',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AppInitializer(),
        routes: {
          '/login': (context) => const LoginPage(),
          '/home': (context) => const HomePage(),
        },
      ),
    );
  }
}

class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  bool _isInitialized = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      // Initialize Firebase
      // await Firebase.initializeApp();
      
      // Initialize API client
      ApiClient().initialize();
      
      // Initialize deep link service for Next.js integration
      await LoginBridgeService().initialize();
      
      // Check authentication status
      final authService = context.read<AuthService>();
      // Temporarily skip authentication check for debugging
      // await authService.isTokenValid();
      print('🔐 Skipping authentication check for debugging');
      
      setState(() {
        _isInitialized = true;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      // Handle initialization error
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('App initialization failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SplashPage();
    }

    if (!_isInitialized) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error, size: 64, color: Colors.red),
              SizedBox(height: 16),
              Text('Failed to initialize app'),
            ],
          ),
        ),
      );
    }

    return Consumer<AuthService>(
      builder: (context, authService, child) {
        // Temporarily always show home page for debugging
        print('🔐 Auth check: ${authService.isLoggedIn}');
        return const HomePage();
        // if (authService.isLoggedIn) {
        //   return const HomePage();
        // } else {
        //   return const LoginPage();
        // }
      },
    );
  }
}
