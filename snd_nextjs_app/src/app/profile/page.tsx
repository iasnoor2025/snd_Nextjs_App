'use client';

import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building,
  Calendar,
  Camera,
  Car,
  Check,
  Clock,
  Database,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  Flag,
  Globe,
  Home,
  IdCard,
  Image,
  Info,
  Key,
  Languages,
  Laptop,
  Link,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Moon,
  Palette,
  Phone,
  Plane,
  QrCode,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Smartphone,
  Star,
  Sun,
  Trash2,
  Upload,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// i18n refactor: All user-facing strings now use useTranslation('profile')
import { useTranslation } from 'react-i18next';

interface MatchedEmployee {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  fileNumber: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  nationality?: string;
  dateOfBirth?: string;
  hireDate?: string;
  iqamaNumber?: string;
  iqamaExpiry?: string;
  passportNumber?: string;
  passportExpiry?: string;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: string;
  operatorLicenseNumber?: string;
  operatorLicenseExpiry?: string;
  designationId?: number;
  departmentId?: number;
  userId?: number;
  designation?: string;
  department?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  department: string;
  location: string;
  bio: string;
  joinDate: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  firstName?: string;
  middleName?: string;
  lastName?: string;
  designation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  nationalId?: string;
  matchedEmployee?: MatchedEmployee;
}

interface ProfileStats {
  profileCompletion: number;
  documentsCount: number;
  lastActivity: string;
  securityScore: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  weeklyReports: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
}

export default function ProfilePage() {
  const { t } = useTranslation('profile');
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: '',
    role: '',
    department: '',
    location: '',
    bio: '',
    joinDate: '',
    lastLogin: '',
    status: 'inactive',
  });

  const [profileStats, setProfileStats] = useState<ProfileStats>({
    profileCompletion: 0,
    documentsCount: 0,
    lastActivity: '',
    securityScore: 85,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    securityAlerts: true,
    weeklyReports: true,
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'system',
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
  });

  // Calculate profile completion percentage
  const calculateProfileCompletion = (profileData: UserProfile) => {
    const fields = [
      'name',
      'email',
      'phone',
      'firstName',
      'lastName',
      'address',
      'city',
      'state',
      'country',
      'bio',
      'role',
      'department',
      'nationalId',
    ];

    let completedFields = 0;
    fields.forEach(field => {
      if (
        profileData[field as keyof UserProfile] &&
        profileData[field as keyof UserProfile] !== ''
      ) {
        completedFields++;
      }
    });

    return Math.round((completedFields / fields.length) * 100);
  };

  // Update profile stats when profile changes
  useEffect(() => {
    if (profile.id) {
      const completion = calculateProfileCompletion(profile);
      setProfileStats(prev => ({
        ...prev,
        profileCompletion: completion,
      }));
    }
  }, [profile]);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Add retry functionality
  const retryFetch = () => {
    setIsLoading(true);
    fetchProfile();
  };

  const fetchProfile = async () => {
    try {

      const response = await fetch('/api/profile');

      

      if (response.ok) {
        const responseText = await response.text();
        if (!responseText) {
          toast.error('Empty response from server');
          return;
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          toast.error('Invalid response format from server');
          return;
        }

        setProfile(data);
      } else {
        const responseText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          errorData = { error: 'Unknown error', details: responseText };
        }

        toast.error(errorData.error || 'Failed to load profile');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          firstName: profile.firstName,
          middleName: profile.middleName,
          lastName: profile.lastName,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          designation: profile.designation,
          department: profile.department,
          nationalId: profile.nationalId,
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        toast.success(t('updateSuccess'));
        setIsEditing(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'notifications',
          settings: notifications,
        }),
      });

      if (response.ok) {
        toast.success(t('notificationSettingsUpdated'));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update notification settings');
      }
    } catch (error) {
      toast.error('Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'appearance',
          settings: appearance,
        }),
      });

      if (response.ok) {
        toast.success(t('appearanceSettingsUpdated'));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update appearance settings');
      }
    } catch (error) {
      toast.error('Failed to update appearance settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      // In a real app, you would call the delete account API
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(t('accountDeletionInitiated'));
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  // Helper function to check if we have real employee data
  const hasRealEmployeeData = () => {
    return profile.firstName || profile.matchedEmployee;
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(prev => ({ ...prev, avatar: result.avatar }));
        toast.success('Profile picture updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', 'general');

      const response = await fetch('/api/profile/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        // Refresh documents list
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Export profile data
  const handleExportProfile = () => {
    const profileData = {
      personalInfo: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        firstName: profile.firstName,
        lastName: profile.lastName,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        bio: profile.bio,
        nationalId: profile.nationalId,
      },
      workInfo: {
        role: profile.role,
        department: profile.department,
        location: profile.location,
        joinDate: profile.joinDate,
      },
      settings: {
        notifications,
        appearance,
      },
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(profileData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profile-${profile.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Profile exported successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/40 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Loading Your Profile</h2>
                <p className="text-muted-foreground">Preparing your personalized dashboard...</p>
              </div>
              <Button variant="outline" size="lg" onClick={retryFetch} className="mt-4">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl"></div>
          <div className="relative p-8 rounded-3xl border bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                    <AvatarImage src={profile.avatar} alt={profile.name} />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                      {profile.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 ring-2 ring-background">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {profile.name || 'Your Profile'}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {profile.role && profile.department
                      ? `${profile.role} • ${profile.department}`
                      : 'Employee Profile'}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="px-3 py-1">
                      <IdCard className="h-3 w-3 mr-1" />
                      {profile.nationalId || 'No National ID'}
                    </Badge>
                    <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                      <Check className="h-3 w-3 mr-1" />
                      {profile.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant={isEditing ? 'outline' : 'default'}
                  size="lg"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isSaving}
                  className="shadow-lg"
                >
                  {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                <Button variant="outline" size="lg" className="shadow-lg">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Profile Completion</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {profileStats.profileCompletion}%
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Progress value={profileStats.profileCompletion} className="mt-3" />
              <p className="text-xs text-blue-600 mt-2">
                {profileStats.profileCompletion < 100
                  ? `${100 - profileStats.profileCompletion} fields remaining`
                  : 'Profile complete!'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Documents</p>
                  <p className="text-2xl font-bold text-green-900">{profileStats.documentsCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-1">Uploaded files</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={() => document.getElementById('document-upload')?.click()}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload New
              </Button>
              <input
                id="document-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Security Score</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {profileStats.securityScore}%
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-1">Account protection</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={() => document.getElementById('security-tab')?.click()}
              >
                <Shield className="h-3 w-3 mr-1" />
                Review
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Last Activity</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-orange-600 mt-1">Recent login</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={handleExportProfile}
              >
                <Download className="h-3 w-3 mr-1" />
                Export Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-900">Quick Actions</h3>
                  <p className="text-sm text-indigo-600">Common profile tasks</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isEditing}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Photo
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportProfile}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden file inputs */}
        <input
          id="avatar-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleProfilePictureUpload}
        />

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
                  <h3 className="text-lg font-semibold">Uploading...</h3>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your file
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Source Alert */}
        {hasRealEmployeeData() && (
          <Alert className="border-primary/20 bg-primary/5">
            <Database className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              <strong>Database Connected:</strong> Your profile is displaying real employee
              information from the database.
              {profile.matchedEmployee && (
                <span className="ml-2">
                  <Link className="h-4 w-4 inline mr-1" />
                  Employee matched via National ID (Iqama Number)
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-8">
            {/* Personal Information Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-muted/20">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <User className="h-6 w-6 text-primary" />
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-base">
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  <div className="flex gap-3">
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="shadow-md"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                    <Button
                      variant={isEditing ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={isSaving}
                      className="shadow-md"
                    >
                      {isEditing ? (
                        <Check className="h-4 w-4 mr-2" />
                      ) : (
                        <Edit className="h-4 w-4 mr-2" />
                      )}
                      {isEditing ? 'Save Changes' : 'Edit Profile'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-8">
                  <div className="relative">
                    <Avatar className="h-32 w-32 ring-4 ring-primary/20 shadow-xl">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                        {profile.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0 shadow-lg"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                        disabled={isUploading}
                      >
                        <Camera className="h-5 w-5" />
                      </Button>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label
                          htmlFor="name"
                          className="text-sm font-semibold text-muted-foreground"
                        >
                          <User className="h-4 w-4 inline mr-2" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={e => setProfile({ ...profile, name: e.target.value })}
                          disabled={!isEditing}
                          className="h-12 text-base border-2 focus:border-primary/50"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="email"
                          className="text-sm font-semibold text-muted-foreground"
                        >
                          <Mail className="h-4 w-4 inline mr-2" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={e => setProfile({ ...profile, email: e.target.value })}
                          disabled={!isEditing}
                          className="h-12 text-base border-2 focus:border-primary/50"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="phone"
                          className="text-sm font-semibold text-muted-foreground"
                        >
                          <Phone className="h-4 w-4 inline mr-2" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={e => setProfile({ ...profile, phone: e.target.value })}
                          disabled={!isEditing}
                          className="h-12 text-base border-2 focus:border-primary/50"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="nationalId"
                          className="text-sm font-semibold text-muted-foreground"
                        >
                          <IdCard className="h-4 w-4 inline mr-2" />
                          National ID (Iqama)
                        </Label>
                        <Input
                          id="nationalId"
                          value={profile.nationalId || ''}
                          onChange={e => setProfile({ ...profile, nationalId: e.target.value })}
                          disabled={!isEditing}
                          className="h-12 text-base border-2 focus:border-primary/50"
                          placeholder="Enter your National ID"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Additional Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Additional Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-semibold text-muted-foreground"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profile.firstName || ''}
                        onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-semibold text-muted-foreground"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profile.lastName || ''}
                        onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="role" className="text-sm font-semibold text-muted-foreground">
                        Job Role
                      </Label>
                      <Input
                        id="role"
                        value={profile.role}
                        onChange={e => setProfile({ ...profile, role: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="department"
                        className="text-sm font-semibold text-muted-foreground"
                      >
                        Department
                      </Label>
                      <Input
                        id="department"
                        value={profile.department}
                        onChange={e => setProfile({ ...profile, department: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="address"
                        className="text-sm font-semibold text-muted-foreground"
                      >
                        <Home className="h-4 w-4 inline mr-2" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={profile.address || ''}
                        onChange={e => setProfile({ ...profile, address: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="city" className="text-sm font-semibold text-muted-foreground">
                        <MapPin className="h-4 w-4 inline mr-2" />
                        City
                      </Label>
                      <Input
                        id="city"
                        value={profile.city || ''}
                        onChange={e => setProfile({ ...profile, city: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="state"
                        className="text-sm font-semibold text-muted-foreground"
                      >
                        <MapPin className="h-4 w-4 inline mr-2" />
                        State/Province
                      </Label>
                      <Input
                        id="state"
                        value={profile.state || ''}
                        onChange={e => setProfile({ ...profile, state: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="country"
                        className="text-sm font-semibold text-muted-foreground"
                      >
                        <Globe className="h-4 w-4 inline mr-2" />
                        Country
                      </Label>
                      <Input
                        id="country"
                        value={profile.country || ''}
                        onChange={e => setProfile({ ...profile, country: e.target.value })}
                        disabled={!isEditing}
                        className="h-11 border-2 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="bio" className="text-sm font-semibold text-muted-foreground">
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={e => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className="border-2 focus:border-primary/50 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Activity
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="bg-primary/20 p-2 rounded-full">
                        <Edit className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Profile Updated</p>
                        <p className="text-xs text-muted-foreground">
                          Personal information was modified
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="bg-green-500/20 p-2 rounded-full">
                        <Camera className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Profile Picture Changed</p>
                        <p className="text-xs text-muted-foreground">
                          New avatar uploaded successfully
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 86400000).toLocaleDateString()} at{' '}
                          {new Date(Date.now() - 86400000).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Document Uploaded</p>
                        <p className="text-xs text-muted-foreground">
                          New document added to profile
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(Date.now() - 172800000).toLocaleDateString()} at{' '}
                          {new Date(Date.now() - 172800000).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="shadow-md"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      size="lg"
                      className="shadow-md"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Account Information Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3 text-blue-900">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                        User ID
                      </span>
                      <p className="text-sm font-semibold text-blue-900 font-mono">{profile.id}</p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                        Status
                      </span>
                      <Badge
                        variant={profile.status === 'active' ? 'default' : 'secondary'}
                        className="w-fit"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {profile.status}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-700">Join Date</span>
                      </div>
                      <span className="text-sm font-medium text-blue-900">
                        {formatDate(profile.joinDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-700">Last Login</span>
                      </div>
                      <span className="text-sm font-medium text-blue-900">
                        {formatDate(profile.lastLogin)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <IdCard className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-700">National ID</span>
                      </div>
                      <span className="text-sm font-medium text-blue-900">
                        {profile.nationalId || 'Not set'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employee Information Card */}
              {hasRealEmployeeData() && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/50 to-green-100/30">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-3 text-green-900">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Briefcase className="h-6 w-6 text-green-600" />
                      </div>
                      Employee Information
                      <Badge
                        variant="outline"
                        className="ml-2 bg-green-100 text-green-700 border-green-300"
                      >
                        <Database className="h-3 w-3 mr-1" />
                        Database
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                          Full Name
                        </span>
                        <p className="text-sm font-semibold text-green-900">
                          {profile.firstName} {profile.middleName} {profile.lastName}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                          Phone
                        </span>
                        <p className="text-sm font-semibold text-green-900">{profile.phone}</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">Designation</span>
                        </div>
                        <span className="text-sm font-medium text-green-900">
                          {profile.designation || 'Not assigned'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">Department</span>
                        </div>
                        <span className="text-sm font-medium text-green-900">
                          {profile.department || 'Not assigned'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700">Location</span>
                        </div>
                        <span className="text-sm font-medium text-green-900">
                          {profile.city && profile.state
                            ? `${profile.city}, ${profile.state}`
                            : profile.country || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Matched Employee Details Card */}
              {profile.matchedEmployee && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-purple-100/30 col-span-1 lg:col-span-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-3 text-purple-900">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Link className="h-6 w-6 text-purple-600" />
                      </div>
                      Matched Employee Details
                      <Badge
                        variant="outline"
                        className="ml-2 bg-purple-100 text-purple-700 border-purple-300"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Auto-Matched
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-purple-700">
                      Employee information automatically matched with your National ID (Iqama
                      Number)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Basic Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          Employee ID
                        </span>
                        <p className="text-sm font-semibold text-purple-900 font-mono">
                          {profile.matchedEmployee.fileNumber}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          Full Name
                        </span>
                        <p className="text-sm font-semibold text-purple-900">
                          {profile.matchedEmployee.firstName} {profile.matchedEmployee.middleName}{' '}
                          {profile.matchedEmployee.lastName}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          Nationality
                        </span>
                        <p className="text-sm font-semibold text-purple-900">
                          {profile.matchedEmployee.nationality || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Personal Details */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Personal Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Date of Birth</span>
                            <span className="text-sm font-medium text-purple-900">
                              {formatDate(profile.matchedEmployee.dateOfBirth)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Hire Date</span>
                            <span className="text-sm font-medium text-purple-900">
                              {formatDate(profile.matchedEmployee.hireDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Phone</span>
                            <span className="text-sm font-medium text-purple-900">
                              {profile.matchedEmployee.phone || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Email</span>
                            <span className="text-sm font-medium text-purple-900">
                              {profile.matchedEmployee.email || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Work Details */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Work Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Designation</span>
                            <span className="text-sm font-medium text-purple-900">
                              {profile.matchedEmployee.designation || 'Not assigned'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Department</span>
                            <span className="text-sm font-medium text-purple-900">
                              {profile.matchedEmployee.department || 'Not assigned'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Address</span>
                            <span className="text-sm font-medium text-purple-900">
                              {profile.matchedEmployee.address || 'Not specified'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                            <span className="text-sm text-purple-700">Location</span>
                            <span className="text-sm font-medium text-purple-900">
                              {profile.matchedEmployee.city && profile.matchedEmployee.state
                                ? `${profile.matchedEmployee.city}, ${profile.matchedEmployee.state}`
                                : profile.matchedEmployee.country || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Documents Section */}
                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents & Licenses
                      </h4>

                      {/* Iqama Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-200/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <IdCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-blue-900">Iqama</h5>
                              <p className="text-xs text-blue-600">Residence Permit</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-700">Number:</span>
                              <span className="font-medium text-blue-900">
                                {profile.matchedEmployee.iqamaNumber}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-700">Expires:</span>
                              <span className="font-medium text-blue-900">
                                {formatDate(profile.matchedEmployee.iqamaExpiry)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Passport Information */}
                        {profile.matchedEmployee.passportNumber && (
                          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg border border-green-200/50">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Globe className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-green-900">Passport</h5>
                                <p className="text-xs text-green-600">Travel Document</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-green-700">Number:</span>
                                <span className="font-medium text-green-900">
                                  {profile.matchedEmployee.passportNumber}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-green-700">Expires:</span>
                                <span className="font-medium text-green-900">
                                  {formatDate(profile.matchedEmployee.passportExpiry)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Licenses */}
                      {(profile.matchedEmployee.drivingLicenseNumber ||
                        profile.matchedEmployee.operatorLicenseNumber) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {profile.matchedEmployee.drivingLicenseNumber && (
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg border border-orange-200/50">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-orange-100 p-2 rounded-lg">
                                  <Car className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-orange-900">Driving License</h5>
                                  <p className="text-xs text-orange-600">Vehicle Operation</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-orange-700">Number:</span>
                                  <span className="font-medium text-orange-900">
                                    {profile.matchedEmployee.drivingLicenseNumber}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-orange-700">Expires:</span>
                                  <span className="font-medium text-orange-900">
                                    {formatDate(profile.matchedEmployee.drivingLicenseExpiry)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {profile.matchedEmployee.operatorLicenseNumber && (
                            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-lg border border-purple-200/50">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <Wrench className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-purple-900">
                                    Operator License
                                  </h5>
                                  <p className="text-xs text-purple-600">Equipment Operation</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-purple-700">Number:</span>
                                  <span className="font-medium text-purple-900">
                                    {profile.matchedEmployee.operatorLicenseNumber}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-purple-700">Expires:</span>
                                  <span className="font-medium text-purple-900">
                                    {formatDate(profile.matchedEmployee.operatorLicenseExpiry)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employee Documents Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50/50 to-indigo-100/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3 text-indigo-900">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-indigo-600" />
                    </div>
                    Employee Documents
                    <Badge
                      variant="outline"
                      className="ml-2 bg-indigo-100 text-indigo-700 border-indigo-300"
                    >
                      <Database className="h-3 w-3 mr-1" />
                      {profileStats.documentsCount} Files
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-indigo-700">
                    View and manage your uploaded documents and certificates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmployeeDocumentsDisplay />
                </CardContent>
              </Card>

              {/* Company Information Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50/50 to-amber-100/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3 text-amber-900">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Building className="h-6 w-6 text-amber-600" />
                    </div>
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                          Company
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-amber-900">SND Rental Management</p>
                    </div>

                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                          Department
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-amber-900">
                        {profile.department || 'Not assigned'}
                      </p>
                    </div>

                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                          Role
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-amber-900">
                        {profile.role || 'Not assigned'}
                      </p>
                    </div>

                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">
                          Location
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-amber-900">
                        {profile.location || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3 text-blue-900">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Manage how you receive notifications and updates across all platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Email Notifications Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-blue-900">Email Notifications</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label htmlFor="email-news" className="text-sm font-medium text-blue-900">
                            Company News
                          </Label>
                          <p className="text-xs text-blue-600">Company announcements and updates</p>
                        </div>
                        <Switch
                          id="email-news"
                          checked={notifications.emailNotifications}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, emailNotifications: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Clock className="h-3 w-3" />
                        <span>Daily digest</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="email-updates"
                            className="text-sm font-medium text-blue-900"
                          >
                            System Updates
                          </Label>
                          <p className="text-xs text-blue-600">Maintenance and system changes</p>
                        </div>
                        <Switch
                          id="email-updates"
                          checked={notifications.securityAlerts}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, securityAlerts: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Immediate alerts</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="email-security"
                            className="text-sm font-medium text-blue-900"
                          >
                            Security Alerts
                          </Label>
                          <p className="text-xs text-blue-600">Critical security notifications</p>
                        </div>
                        <Switch
                          id="email-security"
                          checked={notifications.securityAlerts}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, securityAlerts: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Shield className="h-3 w-3" />
                        <span>Priority alerts</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="email-timesheet"
                            className="text-sm font-medium text-blue-900"
                          >
                            Weekly Reports
                          </Label>
                          <p className="text-xs text-blue-600">Weekly submission reminders</p>
                        </div>
                        <Switch
                          id="email-timesheet"
                          checked={notifications.weeklyReports}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, weeklyReports: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Calendar className="h-3 w-3" />
                        <span>Weekly</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Push Notifications Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-blue-900">Push Notifications</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="push-reminders"
                            className="text-sm font-medium text-blue-900"
                          >
                            Daily Reminders
                          </Label>
                          <p className="text-xs text-blue-600">Task and schedule reminders</p>
                        </div>
                        <Switch
                          id="push-reminders"
                          checked={notifications.pushNotifications}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, pushNotifications: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Bell className="h-3 w-3" />
                        <span>9:00 AM daily</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="push-approvals"
                            className="text-sm font-medium text-blue-900"
                          >
                            Approval Requests
                          </Label>
                          <p className="text-xs text-blue-600">When approval is needed</p>
                        </div>
                        <Switch
                          id="push-approvals"
                          checked={notifications.pushNotifications}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, pushNotifications: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Check className="h-3 w-3" />
                        <span>Immediate</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label htmlFor="push-leave" className="text-sm font-medium text-blue-900">
                            Leave Updates
                          </Label>
                          <p className="text-xs text-blue-600">Leave request status changes</p>
                        </div>
                        <Switch
                          id="push-leave"
                          checked={notifications.pushNotifications}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, pushNotifications: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Plane className="h-3 w-3" />
                        <span>Status changes</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="push-equipment"
                            className="text-sm font-medium text-blue-900"
                          >
                            Equipment Alerts
                          </Label>
                          <p className="text-xs text-blue-600">
                            Maintenance and assignment updates
                          </p>
                        </div>
                        <Switch
                          id="push-equipment"
                          checked={notifications.pushNotifications}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, pushNotifications: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Settings className="h-3 w-3" />
                        <span>Important updates</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notifications */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-blue-900">
                      Additional Notifications
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="sms-notifications"
                            className="text-sm font-medium text-blue-900"
                          >
                            SMS Notifications
                          </Label>
                          <p className="text-xs text-blue-600">Text message alerts</p>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={notifications.smsNotifications}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, smsNotifications: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Phone className="h-3 w-3" />
                        <span>Emergency only</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-blue-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="marketing-emails"
                            className="text-sm font-medium text-blue-900"
                          >
                            Marketing Emails
                          </Label>
                          <p className="text-xs text-blue-600">Promotional content</p>
                        </div>
                        <Switch
                          id="marketing-emails"
                          checked={notifications.marketingEmails}
                          onCheckedChange={checked =>
                            setNotifications({ ...notifications, marketingEmails: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <Mail className="h-3 w-3" />
                        <span>Monthly digest</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Summary */}
                <div className="mt-8 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Notification Summary</p>
                      <p className="text-xs text-blue-600">
                        You'll receive notifications through email and push notifications based on
                        your preferences above. Critical alerts will always be sent regardless of
                        settings.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-purple-100/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3 text-purple-900">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Palette className="h-6 w-6 text-purple-600" />
                  </div>
                  Appearance Settings
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Customize your interface appearance and preferences for the best experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Theme Selection */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Sun className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-purple-900">Theme & Display</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-white/50 rounded-lg border border-purple-200/50">
                      <div className="space-y-3">
                        <Label htmlFor="theme" className="text-sm font-medium text-purple-900">
                          Theme Mode
                        </Label>
                        <Select
                          value={appearance.theme}
                          onValueChange={value =>
                            setAppearance({
                              ...appearance,
                              theme: value as 'light' | 'dark' | 'system',
                            })
                          }
                        >
                          <SelectTrigger className="bg-white/70 border-purple-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4" />
                                Light Theme
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center gap-2">
                                <Moon className="h-4 w-4" />
                                Dark Theme
                              </div>
                            </SelectItem>
                            <SelectItem value="system">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                System Default
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-purple-600">
                          Choose your preferred color scheme
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-purple-200/50">
                      <div className="space-y-3">
                        <Label htmlFor="language" className="text-sm font-medium text-purple-900">
                          Language
                        </Label>
                        <Select
                          value={appearance.language}
                          onValueChange={value => setAppearance({ ...appearance, language: value })}
                        >
                          <SelectTrigger className="bg-white/70 border-purple-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">
                              <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                English
                              </div>
                            </SelectItem>
                            <SelectItem value="es">
                              <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                Español
                              </div>
                            </SelectItem>
                            <SelectItem value="fr">
                              <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                Français
                              </div>
                            </SelectItem>
                            <SelectItem value="de">
                              <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                Deutsch
                              </div>
                            </SelectItem>
                            <SelectItem value="ar">
                              <div className="flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                العربية
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-purple-600">Select your preferred language</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Time & Date Settings */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-purple-900">Time & Date</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-white/50 rounded-lg border border-purple-200/50">
                      <div className="space-y-3">
                        <Label htmlFor="timezone" className="text-sm font-medium text-purple-900">
                          Timezone
                        </Label>
                        <Select
                          value={appearance.timezone}
                          onValueChange={value => setAppearance({ ...appearance, timezone: value })}
                        >
                          <SelectTrigger className="bg-white/70 border-purple-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                            <SelectItem value="Asia/Riyadh">Riyadh (AST)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-purple-600">Set your local timezone</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-purple-200/50">
                      <div className="space-y-3">
                        <Label htmlFor="dateFormat" className="text-sm font-medium text-purple-900">
                          Date Format
                        </Label>
                        <Select
                          value={appearance.dateFormat}
                          onValueChange={value =>
                            setAppearance({ ...appearance, dateFormat: value })
                          }
                        >
                          <SelectTrigger className="bg-white/70 border-purple-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US Format)</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (European Format)</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-purple-600">Choose your preferred date format</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="p-4 bg-white/50 rounded-lg border border-purple-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <h4 className="text-lg font-semibold text-purple-900">Preview</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Current Theme</p>
                      <p className="text-xs text-purple-600 capitalize">{appearance.theme}</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Language</p>
                      <p className="text-xs text-purple-600">
                        {appearance.language === 'en' ? 'English' : appearance.language}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Date Format</p>
                      <p className="text-xs text-purple-600">{appearance.dateFormat}</p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveAppearance}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50/50 to-red-100/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3 text-red-900">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  Security Settings
                </CardTitle>
                <CardDescription className="text-red-700">
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Password Management */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Key className="h-5 w-5 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-red-900">Password Management</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-lg border border-red-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="change-password"
                            className="text-sm font-medium text-red-900"
                          >
                            Change Password
                          </Label>
                          <p className="text-xs text-red-600">Update your login password</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Key className="h-4 w-4 mr-2" />
                          Change
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <Clock className="h-3 w-3" />
                        <span>
                          Last changed: {new Date(Date.now() - 2592000000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-red-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="password-strength"
                            className="text-sm font-medium text-red-900"
                          >
                            Password Strength
                          </Label>
                          <p className="text-xs text-red-600">Current password security level</p>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Strong
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: '85%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Two-Factor Authentication */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-red-900">
                      Two-Factor Authentication
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-lg border border-red-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label htmlFor="2fa-status" className="text-sm font-medium text-red-900">
                            2FA Status
                          </Label>
                          <p className="text-xs text-red-600">Additional security layer</p>
                        </div>
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Shield className="h-4 w-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-red-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="backup-codes"
                            className="text-sm font-medium text-red-900"
                          >
                            Backup Codes
                          </Label>
                          <p className="text-xs text-red-600">Emergency access codes</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Not generated yet</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                {/* Session Management */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <Laptop className="h-5 w-5 text-red-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-red-900">Session Management</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-lg border border-red-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="active-sessions"
                            className="text-sm font-medium text-red-900"
                          >
                            Active Sessions
                          </Label>
                          <p className="text-xs text-red-600">Currently logged in devices</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View All
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <Check className="h-3 w-3" />
                        <span>1 active session</span>
                      </div>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg border border-red-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="space-y-1">
                          <Label
                            htmlFor="login-history"
                            className="text-sm font-medium text-red-900"
                          >
                            Login History
                          </Label>
                          <p className="text-xs text-red-600">Recent login attempts</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Clock className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <Info className="h-3 w-3" />
                        <span>Last: {new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Score */}
                <div className="p-4 bg-white/50 rounded-lg border border-red-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-red-900">Security Score</h4>
                    <Badge variant="default" className="bg-green-600">
                      {profileStats.securityScore}%
                    </Badge>
                  </div>
                  <Progress value={profileStats.securityScore} className="w-full" />
                  <div className="mt-2 text-xs text-red-600">
                    <p>
                      Your account security is{' '}
                      {profileStats.securityScore >= 80
                        ? 'excellent'
                        : profileStats.securityScore >= 60
                          ? 'good'
                          : 'needs improvement'}
                    </p>
                    {profileStats.securityScore < 80 && (
                      <p className="mt-1">
                        Consider enabling 2FA and updating your password regularly
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Deletion */}
                <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-destructive">{t('deleteAccount')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('deleteAccountDescription')}
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('delete')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('deleteAccountTitle')}</DialogTitle>
                          <DialogDescription>{t('deleteAccountConfirmation')}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline">{t('cancel')}</Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Deleting...' : 'Delete Account'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Employee Documents Display Component
function EmployeeDocumentsDisplay() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      console.log('🔄 EmployeeDocumentsDisplay: Starting to fetch documents...');
      const response = await fetch('/api/profile/documents');
      console.log('📊 EmployeeDocumentsDisplay: Response status:', response.status);
      console.log(
        '📊 EmployeeDocumentsDisplay: Response headers:',
        response.headers.get('content-type')
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ EmployeeDocumentsDisplay: Documents data received:', data);
        console.log('✅ EmployeeDocumentsDisplay: Data type:', typeof data);
        console.log('✅ EmployeeDocumentsDisplay: Is array?', Array.isArray(data));
        console.log(
          '✅ EmployeeDocumentsDisplay: Data length:',
          Array.isArray(data) ? data.length : 'Not an array'
        );

        if (Array.isArray(data)) {
          // Check specifically for Iqama documents
          const iqamaDocs = data.filter(doc => doc.document_type === 'iqama');
          console.log('🔍 EmployeeDocumentsDisplay: Iqama documents found:', iqamaDocs.length);
          console.log('🔍 EmployeeDocumentsDisplay: Iqama documents:', iqamaDocs);

          // Check all document types
          const docTypes = [...new Set(data.map(doc => doc.document_type))];
          console.log('🔍 EmployeeDocumentsDisplay: All document types found:', docTypes);
        }

        setDocuments(Array.isArray(data) ? data : []);
      } else {
        const errorText = await response.text();
        console.error('❌ EmployeeDocumentsDisplay: Error response:', errorText);
        setError('Failed to load documents');
      }
    } catch (error) {
      console.error('❌ EmployeeDocumentsDisplay: Network error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (document: any) => {
    if (document.url) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchDocuments} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your Iqama and other documents will appear here once uploaded
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Iqama Document - Special Display */}
      {documents
        .filter(doc => doc.document_type === 'iqama')
        .map(iqamaDoc => (
          <div
            key={iqamaDoc.id}
            className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Iqama Document</h4>
                  <p className="text-sm text-blue-700">ID Card Size</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(iqamaDoc)}
                  className="h-8 px-3"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(iqamaDoc)}
                  className="h-8 px-3"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            {/* Document Preview - ID Card Size */}
            <div className="bg-white rounded-lg border-2 border-dashed border-blue-200 p-4">
              <div className="flex items-center justify-center">
                {iqamaDoc.mime_type?.startsWith('image/') ? (
                  <div className="relative group">
                    <img
                      src={iqamaDoc.url}
                      alt="Iqama Document"
                      className="w-32 h-20 object-cover rounded border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handlePreview(iqamaDoc)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-20 bg-gray-100 rounded border flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-center mt-2">
                <p className="text-xs text-gray-600">Click to view full size</p>
              </div>
            </div>

            <div className="mt-3 text-xs text-blue-600">
              <span>Uploaded: {new Date(iqamaDoc.created_at).toLocaleDateString()}</span>
              {iqamaDoc.file_size && (
                <span className="ml-3">Size: {formatFileSize(iqamaDoc.file_size)}</span>
              )}
            </div>
          </div>
        ))}

      {/* Other Documents */}
      {documents.filter(doc => doc.document_type !== 'iqama').length > 0 && (
        <>
          <Separator />
          <h4 className="text-sm font-medium text-muted-foreground">Other Documents</h4>
          <div className="grid gap-3">
            {documents
              .filter(doc => doc.document_type !== 'iqama')
              .map(document => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getDocumentIcon(document.mime_type)}
                    <div>
                      <p className="text-sm font-medium">{document.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.file_name} • {formatFileSize(document.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(document)}
                      className="h-8 px-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      className="h-8 px-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
