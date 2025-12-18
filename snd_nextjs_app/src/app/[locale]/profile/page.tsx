
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, User, Save, X, Palette } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLoginRedirect } from '@/hooks/use-login-redirect';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const { redirectToLogin } = useLoginRedirect();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationalId: '',
    avatar: '',
    preferredColor: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Employee documents state
  const [employeeDocuments, setEmployeeDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Photo upload state
  const [photoUploading, setPhotoUploading] = useState(false);

  // Get allowed actions for profile management
  const allowedActions = getAllowedActions('own-profile');

  // Photo upload function
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    setPhotoUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local form data with new avatar URL
        setFormData(prev => ({
          ...prev,
          avatar: result.avatar_url
        }));
        
        toast.success('Profile photo updated successfully!');
        
        // Refresh the page to update the session
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setPhotoUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };
  
  // Check if user has permission to view profile
  const canViewProfile = allowedActions.includes('read') || user?.role === 'SUPER_ADMIN';

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirectToLogin(true);
      return;
    }
  }, [session, status, redirectToLogin]);

  // Fetch profile data when component mounts
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
      fetchEmployeeDocuments();
    }
  }, [session?.user?.id]);

  // Fetch profile data from API
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      const data = await response.json();
      
      if (response.ok) {
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          nationalId: data.nationalId || '',
          avatar: data.avatar || '',
          preferredColor: data.preferredColor || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        // Handle API error response
        const errorMessage = data.error || 'Failed to fetch profile data';
        toast.error(errorMessage);
        
        // Set fallback data from session if available
        if (session?.user) {
          setFormData(prev => ({
            ...prev,
            email: session.user.email || '',
            firstName: session.user.name?.split(' ')[0] || '',
            lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to fetch profile data');
      
      // Set fallback data from session if available
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          email: session.user.email || '',
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee documents from API
  const fetchEmployeeDocuments = async () => {
    try {
      setDocumentsLoading(true);
      
      // First get the profile data to find the employee ID
      const profileResponse = await fetch('/api/profile');
      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok) {
        setEmployeeDocuments([]);
        return;
      }
      
      // If we have employee data and employee ID, fetch documents using the working API
      if (profileData.employeeLinked && profileData.employeeId) {
        // Use the same API that the Personal tab uses - this one works!
        const documentsResponse = await fetch(`/api/employees/${profileData.employeeId}/documents`);
        const documentsData = await documentsResponse.json();
        
        if (documentsResponse.ok && Array.isArray(documentsData)) {
          // Filter for personal documents (photos, iqama, passport) like the Personal tab does
          const personalDocs = documentsData.filter((d: any) => {
            const docName = (d.fileName || d.name || '').toLowerCase();
            const docType = (d.documentType || '').toLowerCase();
            
            return (
              docName.includes('photo') || 
              docName.includes('picture') || 
              docName.includes('image') ||
              docName.includes('passport') ||
              docName.includes('iqama') ||
              docType.includes('photo') ||
              docType.includes('passport') ||
              docType.includes('iqama') ||
              docType === 'employee_photo' ||
              docType === 'employee_iqama' ||
              docType === 'employee_passport'
            );
          });
          setEmployeeDocuments(personalDocs);
        } else {
          setEmployeeDocuments([]);
        }
      } else {
        setEmployeeDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      setEmployeeDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    // Basic validation
    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (!formData.email?.trim()) {
      toast.error('Email is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || '',
          preferredColor: formData.preferredColor || null,
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        setEditing(false);
        // Refresh profile data
        await fetchProfileData();
        // Trigger a page refresh to apply color changes across all components
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Basic validation
    if (!formData.currentPassword?.trim()) {
      toast.error('Current password is required');
      return;
    }

    if (!formData.newPassword?.trim()) {
      toast.error('New password is required');
      return;
    }

    if (!formData.confirmPassword?.trim()) {
      toast.error('Please confirm your new password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    // Check if new password is different from current password
    if (formData.currentPassword === formData.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword.trim(),
          newPassword: formData.newPassword.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Password changed successfully');
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditing(false);
    // Reset form data to original values
    fetchProfileData();
    toast.info('Profile editing cancelled');
  };

  if (loading && !formData.email) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your profile information...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Check if user has permission to view profile
  if (!canViewProfile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to view your profile.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator to request access.</p>
            <Button 
              onClick={() => router.push('/')} 
              className="mt-4"
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                     {/* Header */}
           <div className="mb-8">
             <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
             <p className="mt-2 text-gray-600">
               {formData.firstName || formData.lastName 
                 ? `Manage your account settings and preferences for ${formData.firstName} ${formData.lastName}`
                 : 'Manage your account settings and preferences'
               }
             </p>
             
                           {/* Profile Photo Section */}
              <div className="mt-6 flex items-center space-x-6">
                <div className="relative">
                  {/* Show employee photo if available, otherwise show user avatar */}
                  {(() => {
                    const employeePhoto = employeeDocuments.find(doc => doc.isPhoto);
                    if (employeePhoto) {
                      return (
                        <img
                          src={employeePhoto.filePath}
                          alt={`${formData.firstName} ${formData.lastName}`}
                          className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      );
                    } else if (formData.avatar) {
                      return (
                        <img
                          src={formData.avatar}
                          alt={`${formData.firstName} ${formData.lastName}`}
                          className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      );
                    }
                    return null;
                  })()}
                  <div className={`h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg ${(formData.avatar || employeeDocuments.find(doc => doc.isPhoto)) ? 'hidden' : ''}`}>
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                 
                {/* Photo Upload Button */}
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-2 -right-2 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg cursor-pointer"
                  title="Upload Photo"
                >
                  {photoUploading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={photoUploading}
                />
               </div>
               
               <div className="flex-1">
                 <h2 className="text-xl font-semibold text-gray-900">
                   {formData.firstName && formData.lastName 
                     ? `${formData.firstName} ${formData.lastName}`
                     : 'Profile Photo'
                   }
                 </h2>
                 <p className="text-sm text-gray-500 mt-1">
                   {formData.avatar ? 'Click the + button to change your photo' : 'Add a profile photo to personalize your account'}
                 </p>
               </div>
             </div>
                               {!formData.firstName && !formData.lastName && (
                     <p className="mt-2 text-sm text-gray-500">
                       No profile information found. Use the form below to add your details.
                     </p>
                   )}
                   {!formData.nationalId && (
                     <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                       <div className="flex">
                         <div className="flex-shrink-0">
                           <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                           </svg>
                         </div>
                         <div className="ml-3">
                           <h3 className="text-sm font-medium text-yellow-800">
                             National ID Required
                           </h3>
                           <div className="mt-2 text-sm text-yellow-700">
                             <p>
                               To link your profile with your employee record, please provide your National ID (Iqama number) in the form below.
                             </p>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                   {formData.nationalId && (
                     <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                       <div className="flex">
                         <div className="flex-shrink-0">
                           <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                           </svg>
                         </div>
                         <div className="ml-3">
                           <h3 className="text-sm font-medium text-green-800">
                             Employee Record Linked
                           </h3>
                           <div className="mt-2 text-sm text-green-700">
                             <p>
                               Your profile has been automatically linked to your employee record using your National ID.
                             </p>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
          </div>

          <div className="grid gap-8">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      {formData.firstName || formData.lastName 
                        ? `Update your personal information and contact details for ${formData.firstName} ${formData.lastName}`
                        : 'Update your personal information and contact details'
                      }
                    </CardDescription>
                  </div>
                  {!editing && (
                    <Button
                      onClick={() => setEditing(true)}
                      disabled={!allowedActions.includes('update')}
                      title={!allowedActions.includes('update') ? 'You do not have permission to edit your profile' : ''}
                    >
                      Edit Profile
                    </Button>
                  )}
                  
                  {!allowedActions.includes('update') && (
                    <p className="text-sm text-gray-500 mt-2">
                      You do not have permission to edit your profile. Contact your administrator.
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!editing}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!editing}
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!editing}
                      placeholder="Enter your email"
                    />
                  </div>
                                     <div className="space-y-2">
                     <Label htmlFor="phone">Phone</Label>
                     <Input
                       id="phone"
                       value={formData.phone}
                       onChange={(e) => handleInputChange('phone', e.target.value)}
                       disabled={!editing}
                       placeholder="Enter your phone number"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="nationalId">National ID (Iqama)</Label>
                     <Input
                       id="nationalId"
                       value={formData.nationalId || ''}
                       disabled={true}
                       placeholder="National ID will be set automatically"
                     />
                     <p className="text-xs text-gray-500">
                       This field is automatically populated when you set your National ID.
                     </p>
                   </div>
                   <div className="space-y-2 md:col-span-2">
                     <Label htmlFor="preferredColor" className="flex items-center gap-2">
                       <Palette className="h-4 w-4" />
                       Preferred UI Color
                     </Label>
                     <Select
                       value={formData.preferredColor ? formData.preferredColor : 'default'}
                       onValueChange={(value) => handleInputChange('preferredColor', value === 'default' ? '' : value)}
                       disabled={!editing}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Use role color (default)" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="default">Use role color (default)</SelectItem>
                         <SelectItem value="red">Red</SelectItem>
                         <SelectItem value="blue">Blue</SelectItem>
                         <SelectItem value="purple">Purple</SelectItem>
                         <SelectItem value="orange">Orange</SelectItem>
                         <SelectItem value="green">Green</SelectItem>
                         <SelectItem value="gray">Gray</SelectItem>
                         <SelectItem value="slate">Slate</SelectItem>
                         <SelectItem value="indigo">Indigo</SelectItem>
                         <SelectItem value="teal">Teal</SelectItem>
                         <SelectItem value="pink">Pink</SelectItem>
                         <SelectItem value="cyan">Cyan</SelectItem>
                         <SelectItem value="amber">Amber</SelectItem>
                         <SelectItem value="emerald">Emerald</SelectItem>
                         <SelectItem value="violet">Violet</SelectItem>
                         <SelectItem value="rose">Rose</SelectItem>
                       </SelectContent>
                     </Select>
                     <p className="text-xs text-gray-500">
                       Choose your preferred color for the UI. This will override your role color. Select "Use role color (default)" to use your role's default color.
                     </p>
                   </div>
                 </div>

                                 {!formData.firstName && !formData.lastName && !editing && (
                   <div className="text-center py-4 text-sm text-gray-500">
                     <p>No profile information found. Click "Edit Profile" to add your details.</p>
                   </div>
                 )}
                 
                 

                {editing && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleUpdateProfile} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        placeholder="Enter current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handlePasswordChange} 
                    disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword || !allowedActions.includes('update')}
                    title={!allowedActions.includes('update') ? 'You do not have permission to change your password' : ''}
                  >
                    {loading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                  
                  {!allowedActions.includes('update') && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      You do not have permission to change your password. Contact your administrator.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

                         {/* Employee Documents Card */}
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle className="flex items-center gap-2">
                       <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                       Personal Photos & Documents
                     </CardTitle>
                     <CardDescription>
                       Employee photos, Iqama, Passport, and identification documents
                     </CardDescription>
                   </div>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={fetchEmployeeDocuments}
                     disabled={documentsLoading}
                   >
                     <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                     {documentsLoading ? 'Refreshing...' : 'Refresh'}
                   </Button>
                 </div>
               </CardHeader>
               <CardContent>
                 {documentsLoading ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                     <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
                   </div>
                 ) : employeeDocuments.length > 0 ? (
                   <div>
                     <h4 className="font-medium text-gray-900 mb-4">Uploaded Documents</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {employeeDocuments.map((doc) => (
                         <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                           {doc.isImage ? (
                             <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                               <img
                                 src={doc.filePath}
                                 alt={doc.description || doc.fileName}
                                 className="w-full h-full object-cover"
                                 onError={(e) => {
                                   e.currentTarget.style.display = 'none';
                                   e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                 }}
                               />
                               <div className="hidden w-full h-full flex items-center justify-center">
                                 <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                 </svg>
                               </div>
                             </div>
                           ) : (
                             <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                               <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                             </div>
                           )}
                           
                           <div className="text-center">
                             <p className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>
                               {doc.fileName}
                             </p>
                             <Button
                               size="sm"
                               className="mt-2 w-full"
                               onClick={() => window.open(doc.filePath, '_blank')}
                             >
                               <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                               </svg>
                               {doc.documentType === 'Employee-Photo' ? 'Employee Photo' : doc.documentType}
                             </Button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     <p className="text-sm">No employee documents found.</p>
                     <p className="text-xs mt-1">Documents will appear here once they are uploaded to your employee record.</p>
                   </div>
                 )}
               </CardContent>
             </Card>

             {/* Account Information Card */}
             <Card>
               <CardHeader>
                 <CardTitle>Account Information</CardTitle>
                 <CardDescription>
                   Your account details and role information
                 </CardDescription>
               </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">User ID</Label>
                    <p className="text-sm text-gray-900">{session?.user?.id || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Role</Label>
                    <p className="text-sm text-gray-900">{user?.role || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Account Status</Label>
                    <p className="text-sm text-gray-900">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Last Login</Label>
                    <p className="text-sm text-gray-900">
                      N/A
                    </p>
                  </div>
                </div>

                {!formData.firstName && !formData.lastName && (
                  <div className="text-center py-4 text-sm text-gray-500 border-t pt-4">
                    <p>Profile information will be populated once you add your details.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
