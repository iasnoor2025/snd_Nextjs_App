import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../services/auth_service.dart';
import '../../../services/login_bridge_service.dart';

class NextJsLoginPage extends StatefulWidget {
  const NextJsLoginPage({super.key});

  @override
  State<NextJsLoginPage> createState() => _NextJsLoginPageState();
}

class _NextJsLoginPageState extends State<NextJsLoginPage> {
  final LoginBridgeService _loginBridge = LoginBridgeService();
  bool _isLoading = false;

  Future<void> _loginWithNextJs() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Generate URL to redirect to Next.js app
      final nextJsUrl = _loginBridge.generateNextJsLoginUrl();
      
      // In a real app, you would open this URL in a web view or browser
      // For demo purposes, we'll simulate the login
      await _simulateNextJsLogin();
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Login failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _simulateNextJsLogin() async {
    // Simulate successful login from Next.js
    final authService = context.read<AuthService>();
    await authService.signInWithGoogle();
    
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // App Logo
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Colors.blue.shade600,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.business,
                  size: 60,
                  color: Colors.white,
                ),
              ),
              
              const SizedBox(height: 32),
              
              // App Title
              const Text(
                'SND Rental Management',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 8),
              
              const Text(
                'Mobile App',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 48),
              
              // Login Options
              const Text(
                'Choose your login method:',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Next.js App Login Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _loginWithNextJs,
                  icon: const Icon(Icons.web, color: Colors.white),
                  label: Text(
                    _isLoading ? 'Connecting...' : 'Login with Next.js App',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade600,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Direct Google Login Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton.icon(
                  onPressed: _isLoading ? null : () async {
                    final authService = context.read<AuthService>();
                    await authService.signInWithGoogle();
                    if (mounted) {
                      Navigator.of(context).pushReplacementNamed('/home');
                    }
                  },
                  icon: const Icon(Icons.login, color: Colors.blue),
                  label: const Text(
                    'Direct Google Login',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.blue,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    side: BorderSide(color: Colors.blue.shade600),
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Info Text
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: const Column(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.blue,
                      size: 24,
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Next.js Integration',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Users from your Next.js web app can seamlessly login to this mobile app using the same Google account.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
