import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../services/auth_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/ui/card.dart';
import '../../providers/user_profile_provider.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart' as custom;

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    _animationController.forward();
    
    // Load user profile data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<UserProfileProvider>().loadUserProfile();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Consumer2<AuthService, UserProfileProvider>(
        builder: (context, authService, profileProvider, child) {
          final user = authService.currentUser;
          
          // Show loading state
          if (profileProvider.isLoading) {
            return const LoadingWidget();
          }
          
          // Show error state
          if (profileProvider.hasError) {
            return custom.ErrorWidget(
              message: profileProvider.error ?? 'Failed to load profile',
              onRetry: () => profileProvider.loadUserProfile(),
            );
          }
          
          return FadeTransition(
            opacity: _fadeAnimation,
            child: CustomScrollView(
              slivers: [
                // Futuristic Header
                _buildFuturisticHeader(user, profileProvider),
                
                // Profile Content
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(AppTheme.spacing),
                    child: Column(
                      children: [
                        // Personal Information Card
                        _buildPersonalInfoCard(user, profileProvider),
                        const SizedBox(height: AppTheme.spacing),
                        
                        // Professional Information Card
                        _buildProfessionalInfoCard(profileProvider),
                        const SizedBox(height: AppTheme.spacing),
                        
                        // Contact Information Card
                        _buildContactInfoCard(user, profileProvider),
                        const SizedBox(height: AppTheme.spacing),
                        
                        // Security & Settings Card
                        _buildSecurityCard(authService),
                        const SizedBox(height: AppTheme.spacing),
                        
                        // Statistics Card
                        _buildStatisticsCard(profileProvider),
                        const SizedBox(height: AppTheme.spacingLg),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFuturisticHeader(GoogleSignInAccount? user, UserProfileProvider profileProvider) {
    return SliverAppBar(
      expandedHeight: 250,
      floating: false,
      pinned: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.primary.withValues(alpha: 0.1),
                AppTheme.primary.withValues(alpha: 0.05),
                AppTheme.background,
              ],
              stops: const [0.0, 0.7, 1.0],
            ),
          ),
          child: Stack(
            children: [
              // Animated Background Pattern
              Positioned.fill(
                child: CustomPaint(
                  painter: FuturisticPatternPainter(),
                ),
              ),
              
              // Profile Content
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Padding(
                  padding: const EdgeInsets.all(AppTheme.spacingLg),
                  child: Column(
                    children: [
                      // Futuristic Avatar
                      _buildFuturisticAvatar(user),
                      const SizedBox(height: AppTheme.spacing),
                      
                      // User Name
                      Text(
                        profileProvider.userProfile?.displayName ?? 
                        user?.displayName ?? 
                        'User Profile',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: AppTheme.fontWeightBold,
                          color: AppTheme.foreground,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacingXs),
                      
                      // User Email
                      Text(
                        profileProvider.userProfile?.email ?? 
                        user?.email ?? 
                        'user@example.com',
                        style: TextStyle(
                          fontSize: AppTheme.fontSizeSm,
                          color: AppTheme.mutedForeground,
                        ),
                      ),
                      const SizedBox(height: AppTheme.spacingXs),
                      
                      // User Role
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppTheme.spacingSm,
                          vertical: AppTheme.spacingXs,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                          border: Border.all(
                            color: AppTheme.primary.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          profileProvider.userProfile?.role ?? 'USER',
                          style: const TextStyle(
                            fontSize: AppTheme.fontSizeXs,
                            color: AppTheme.primary,
                            fontWeight: AppTheme.fontWeightMedium,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(AppTheme.spacingXs),
            decoration: BoxDecoration(
              color: AppTheme.destructive.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppTheme.radius),
              border: Border.all(
                color: AppTheme.destructive.withValues(alpha: 0.3),
                width: 1,
              ),
            ),
            child: const Icon(
              Icons.logout,
              color: AppTheme.destructive,
              size: 20,
            ),
          ),
          onPressed: () async {
            final authService = context.read<AuthService>();
            await authService.signOut();
            if (context.mounted) {
              Navigator.of(context).pushReplacementNamed('/login');
            }
          },
        ),
        const SizedBox(width: AppTheme.spacing),
      ],
    );
  }

  Widget _buildFuturisticAvatar(GoogleSignInAccount? user) {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.primary,
            AppTheme.primary.withValues(alpha: 0.8),
            AppTheme.primary.withValues(alpha: 0.6),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Container(
        margin: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppTheme.background,
        ),
        child: Container(
          margin: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            image: user?.photoUrl != null
                ? DecorationImage(
                    image: NetworkImage(user!.photoUrl!),
                    fit: BoxFit.cover,
                  )
                : null,
            color: user?.photoUrl == null ? AppTheme.muted : null,
          ),
          child: user?.photoUrl == null
              ? const Icon(
                  Icons.person,
                  size: 40,
                  color: AppTheme.mutedForeground,
                )
              : null,
        ),
      ),
    );
  }

  Widget _buildPersonalInfoCard(GoogleSignInAccount? user, UserProfileProvider profileProvider) {
    return UICard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingSm),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
                child: const Icon(
                  Icons.person_outline,
                  color: AppTheme.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppTheme.spacing),
              const Text(
                'Personal Information',
                style: TextStyle(
                  fontSize: AppTheme.fontSizeLg,
                  fontWeight: AppTheme.fontWeightBold,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing),
          
          _buildInfoRow('Full Name', profileProvider.userProfile?.displayName ?? 'Not Available'),
          _buildInfoRow('Email Address', profileProvider.userProfile?.email ?? 'Not Available'),
          _buildInfoRow('User ID', profileProvider.userProfile?.id.toString() ?? 'Not Available'),
          _buildInfoRow('Role', profileProvider.userProfile?.role ?? 'Not Available'),
          _buildInfoRow('Account Status', profileProvider.userProfile?.isActive == true ? 'Active' : 'Inactive', isStatus: profileProvider.userProfile?.isActive == true),
        ],
      ),
    );
  }

  Widget _buildProfessionalInfoCard(UserProfileProvider profileProvider) {
    return UICard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingSm),
                decoration: BoxDecoration(
                  color: AppTheme.secondary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
                child: const Icon(
                  Icons.work_outline,
                  color: AppTheme.secondary,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppTheme.spacing),
              const Text(
                'Professional Information',
                style: TextStyle(
                  fontSize: AppTheme.fontSizeLg,
                  fontWeight: AppTheme.fontWeightBold,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing),
          
          _buildInfoRow('Department', profileProvider.employeeDepartment ?? 'Not Available'),
          _buildInfoRow('Designation', profileProvider.employeeDesignation ?? 'Not Available'),
          _buildInfoRow('Employee ID', profileProvider.getEmployeeField('employee_id') ?? 'Not Available'),
          _buildInfoRow('File Number', profileProvider.getEmployeeField('file_number') ?? 'Not Available'),
          _buildInfoRow('Hire Date', profileProvider.employeeHireDate ?? 'Not Available'),
          _buildInfoRow('Work Location', profileProvider.employeeCurrentLocation ?? 'Not Available'),
          _buildInfoRow('Employee Status', profileProvider.employeeStatus ?? 'Not Available', isStatus: profileProvider.employeeStatus == 'active'),
        ],
      ),
    );
  }

  Widget _buildContactInfoCard(GoogleSignInAccount? user, UserProfileProvider profileProvider) {
    return UICard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingSm),
                decoration: BoxDecoration(
                  color: AppTheme.accent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
                child: const Icon(
                  Icons.contact_phone_outlined,
                  color: AppTheme.accent,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppTheme.spacing),
              const Text(
                'Contact Information',
                style: TextStyle(
                  fontSize: AppTheme.fontSizeLg,
                  fontWeight: AppTheme.fontWeightBold,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing),
          
          _buildInfoRow('Primary Email', profileProvider.userProfile?.email ?? user?.email ?? 'Not Available'),
          _buildInfoRow('Phone Number', profileProvider.employeePhone ?? 'Not Available'),
          _buildInfoRow('Emergency Contact', profileProvider.employeeEmergencyContact ?? 'Not Available'),
          _buildInfoRow('Address', profileProvider.employeeAddress ?? 'Not Available'),
          _buildInfoRow('Nationality', profileProvider.employeeNationality ?? 'Not Available'),
        ],
      ),
    );
  }

  Widget _buildSecurityCard(AuthService authService) {
    return UICard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingSm),
                decoration: BoxDecoration(
                  color: AppTheme.destructive.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
                child: const Icon(
                  Icons.security_outlined,
                  color: AppTheme.destructive,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppTheme.spacing),
              const Text(
                'Security & Settings',
                style: TextStyle(
                  fontSize: AppTheme.fontSizeLg,
                  fontWeight: AppTheme.fontWeightBold,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing),
          
          _buildActionRow(
            'Change Password',
            'Update your account password',
            Icons.lock_outline,
            () {
              // TODO: Implement change password
            },
          ),
          _buildActionRow(
            'Two-Factor Authentication',
            'Enable 2FA for extra security',
            Icons.verified_user_outlined,
            () {
              // TODO: Implement 2FA
            },
          ),
          _buildActionRow(
            'Privacy Settings',
            'Manage your privacy preferences',
            Icons.privacy_tip_outlined,
            () {
              // TODO: Implement privacy settings
            },
          ),
          _buildActionRow(
            'Sign Out',
            'Sign out from all devices',
            Icons.logout,
            () async {
              await authService.signOut();
              if (context.mounted) {
                Navigator.of(context).pushReplacementNamed('/login');
              }
            },
            isDestructive: true,
          ),
        ],
      ),
    );
  }

  Widget _buildStatisticsCard(UserProfileProvider profileProvider) {
    return UICard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppTheme.spacingSm),
                decoration: BoxDecoration(
                  color: AppTheme.muted.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
                child: const Icon(
                  Icons.analytics_outlined,
                  color: AppTheme.mutedForeground,
                  size: 20,
                ),
              ),
              const SizedBox(width: AppTheme.spacing),
              const Text(
                'Account Statistics',
                style: TextStyle(
                  fontSize: AppTheme.fontSizeLg,
                  fontWeight: AppTheme.fontWeightBold,
                  color: AppTheme.foreground,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing),
          
          Row(
            children: [
              Expanded(
                child: _buildStatItem('Basic Salary', profileProvider.employeeBasicSalary != null ? '${profileProvider.employeeBasicSalary} SAR' : 'Not Available', Icons.account_balance_wallet),
              ),
              Expanded(
                child: _buildStatItem('Hourly Rate', profileProvider.getEmployeeField('hourly_rate') != null ? '${profileProvider.getEmployeeField('hourly_rate')} SAR/hr' : 'Not Available', Icons.schedule),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing),
          Row(
            children: [
              Expanded(
                child: _buildStatItem('Iqama Number', profileProvider.employeeIqamaNumber ?? 'Not Available', Icons.badge),
              ),
              Expanded(
                child: _buildStatItem('Iqama Expiry', profileProvider.employeeIqamaExpiry ?? 'Not Available', Icons.calendar_today),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacing),
          Row(
            children: [
              Expanded(
                child: _buildStatItem('Supervisor', profileProvider.employeeSupervisor ?? 'Not Available', Icons.supervisor_account),
              ),
              Expanded(
                child: _buildStatItem('Contract Days/Month', profileProvider.getEmployeeField('contract_days_per_month') ?? 'Not Available', Icons.calendar_month),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isStatus = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppTheme.spacingSm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: AppTheme.fontSizeSm,
                color: AppTheme.mutedForeground,
                fontWeight: AppTheme.fontWeightMedium,
              ),
            ),
          ),
          Expanded(
            child: isStatus
                ? Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppTheme.spacingXs,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.success.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                      border: Border.all(
                        color: AppTheme.success.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      value,
                      style: const TextStyle(
                        fontSize: AppTheme.fontSizeXs,
                        color: AppTheme.success,
                        fontWeight: AppTheme.fontWeightMedium,
                      ),
                    ),
                  )
                : Text(
                    value,
                    style: const TextStyle(
                      fontSize: AppTheme.fontSizeSm,
                      color: AppTheme.foreground,
                      fontWeight: AppTheme.fontWeightNormal,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionRow(
    String title,
    String subtitle,
    IconData icon,
    VoidCallback onTap, {
    bool isDestructive = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radius),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppTheme.spacingSm),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppTheme.spacingXs),
              decoration: BoxDecoration(
                color: (isDestructive ? AppTheme.destructive : AppTheme.muted)
                    .withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppTheme.radius),
              ),
              child: Icon(
                icon,
                color: isDestructive ? AppTheme.destructive : AppTheme.mutedForeground,
                size: 18,
              ),
            ),
            const SizedBox(width: AppTheme.spacing),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: AppTheme.fontSizeSm,
                      fontWeight: AppTheme.fontWeightMedium,
                      color: isDestructive ? AppTheme.destructive : AppTheme.foreground,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: AppTheme.fontSizeXs,
                      color: AppTheme.mutedForeground,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: AppTheme.mutedForeground,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(AppTheme.spacing),
      margin: const EdgeInsets.only(right: AppTheme.spacingXs),
      decoration: BoxDecoration(
        color: AppTheme.muted.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(AppTheme.radius),
        border: Border.all(
          color: AppTheme.muted.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 16,
                color: AppTheme.mutedForeground,
              ),
              const SizedBox(width: AppTheme.spacingXs),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: AppTheme.fontSizeXs,
                    color: AppTheme.mutedForeground,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppTheme.spacingXs),
          Text(
            value,
            style: const TextStyle(
              fontSize: AppTheme.fontSizeLg,
              fontWeight: AppTheme.fontWeightBold,
              color: AppTheme.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class FuturisticPatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.primary.withValues(alpha: 0.1)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    // Draw futuristic grid pattern
    for (int i = 0; i < size.width; i += 40) {
      canvas.drawLine(
        Offset(i.toDouble(), 0),
        Offset(i.toDouble(), size.height),
        paint,
      );
    }

    for (int i = 0; i < size.height; i += 40) {
      canvas.drawLine(
        Offset(0, i.toDouble()),
        Offset(size.width, i.toDouble()),
        paint,
      );
    }

    // Draw corner accents
    final cornerPaint = Paint()
      ..color = AppTheme.primary.withValues(alpha: 0.3)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    const cornerSize = 60.0;
    
    // Top-left corner
    canvas.drawPath(
      Path()
        ..moveTo(0, cornerSize)
        ..lineTo(0, 0)
        ..lineTo(cornerSize, 0),
      cornerPaint,
    );

    // Top-right corner
    canvas.drawPath(
      Path()
        ..moveTo(size.width - cornerSize, 0)
        ..lineTo(size.width, 0)
        ..lineTo(size.width, cornerSize),
      cornerPaint,
    );

    // Bottom-left corner
    canvas.drawPath(
      Path()
        ..moveTo(0, size.height - cornerSize)
        ..lineTo(0, size.height)
        ..lineTo(cornerSize, size.height),
      cornerPaint,
    );

    // Bottom-right corner
    canvas.drawPath(
      Path()
        ..moveTo(size.width - cornerSize, size.height)
        ..lineTo(size.width, size.height)
        ..lineTo(size.width, size.height - cornerSize),
      cornerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}