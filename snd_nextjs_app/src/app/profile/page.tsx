"use client"

import { useState, useEffect } from "react"
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBuilding,
  IconShield,
  IconBell,
  IconPalette,
  IconLanguage,
  IconKey,
  IconTrash,
  IconEdit,
  IconCamera,
  IconCheck,
  IconX
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  role: string
  department: string
  location: string
  bio: string
  joinDate: string
  lastLogin: string
  status: "active" | "inactive"
  firstName?: string
  middleName?: string
  lastName?: string
  designation?: string
  address?: string
  city?: string
  state?: string
  country?: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  securityAlerts: boolean
  weeklyReports: boolean
}

interface AppearanceSettings {
  theme: "light" | "dark" | "system"
  language: string
  timezone: string
  dateFormat: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    phone: "+1 (555) 123-4567",
    avatar: "",
    role: "ADMIN",
    department: "General",
    location: "Demo Location",
    bio: "This is a demo profile. Connect to the backend to see real data.",
    joinDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: "active"
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    securityAlerts: true,
    weeklyReports: true
  })

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: "system",
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY"
  })

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile()
  }, [])

  // Add retry functionality
  const retryFetch = () => {
    setIsLoading(true)
    fetchProfile()
  }

  const fetchProfile = async () => {
    try {
  
      const response = await fetch('/api/profile')
      

      if (response.ok) {
        const data = await response.json()

        setProfile(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Profile fetch error:', errorData)
        toast.error(errorData.error || 'Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile - check console for details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
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
        }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        toast.success("Profile updated successfully")
        setIsEditing(false)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update profile")
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error("Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
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
      })

      if (response.ok) {
        toast.success("Notification settings updated")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update notification settings")
      }
    } catch (error) {
      console.error('Error updating notifications:', error)
      toast.error("Failed to update notification settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAppearance = async () => {
    setIsSaving(true)
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
      })

      if (response.ok) {
        toast.success("Appearance settings updated")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update appearance settings")
      }
    } catch (error) {
      console.error('Error updating appearance:', error)
      toast.error("Failed to update appearance settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsSaving(true)
    try {
      // In a real app, you would call the delete account API
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success("Account deletion initiated")
    } catch (error) {
      toast.error("Failed to delete account")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="h-full w-full bg-background">
        <div className="w-full p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
              <Button
                variant="outline"
                size="sm"
                onClick={retryFetch}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-background">
      <div className="w-full p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings, preferences, and personal information.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Debug Info:</p>
            <p className="text-sm text-muted-foreground">Profile ID: {profile.id}</p>
            <p className="text-sm text-muted-foreground">Name: {profile.name}</p>
            <p className="text-sm text-muted-foreground">Email: {profile.email}</p>
            <p className="text-sm text-muted-foreground">Status: {profile.status}</p>
            <div className="mt-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${profile.id.startsWith('demo') || profile.id.startsWith('error') ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {profile.id.startsWith('demo') || profile.id.startsWith('error') ? 'Session Mode (Database not connected)' : 'Connected to Database'}
              </span>
            </div>
            {(profile.id.startsWith('demo') || profile.id.startsWith('error')) && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                <p className="font-medium text-yellow-800">Database Setup Required</p>
                <p className="text-yellow-700">See DATABASE_SETUP_QUICK.md for instructions</p>
              </div>
            )}
            {profile.firstName && (
              <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
                <p className="font-medium text-blue-800">Employee Data Available</p>
                <p className="text-blue-700">Name: {profile.firstName} {profile.lastName}</p>
                <p className="text-blue-700">Phone: {profile.phone}</p>
                <p className="text-blue-700">Location: {profile.city}, {profile.state}</p>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                                     <Button
                     variant={isEditing ? "outline" : "default"}
                     onClick={() => setIsEditing(!isEditing)}
                     disabled={isSaving}
                   >
                     {isEditing ? <IconX className="h-4 w-4 mr-2" /> : <IconEdit className="h-4 w-4 mr-2" />}
                     {isEditing ? "Cancel" : "Edit"}
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-2xl">
                        {profile.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      >
                        <IconCamera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="firstName">First Name</Label>
                     <Input
                       id="firstName"
                       value={profile.firstName || ''}
                       onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="lastName">Last Name</Label>
                     <Input
                       id="lastName"
                       value={profile.lastName || ''}
                       onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="role">Role</Label>
                     <Input
                       id="role"
                       value={profile.role}
                       onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="department">Department</Label>
                     <Input
                       id="department"
                       value={profile.department}
                       onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="address">Address</Label>
                     <Input
                       id="address"
                       value={profile.address || ''}
                       onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="city">City</Label>
                     <Input
                       id="city"
                       value={profile.city || ''}
                       onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="state">State</Label>
                     <Input
                       id="state"
                       value={profile.state || ''}
                       onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="country">Country</Label>
                     <Input
                       id="country"
                       value={profile.country || ''}
                       onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                       disabled={!isEditing}
                     />
                   </div>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>

                                 {isEditing && (
                   <div className="flex justify-end space-x-2">
                     <Button
                       variant="outline"
                       onClick={() => setIsEditing(false)}
                       disabled={isSaving}
                     >
                       Cancel
                     </Button>
                     <Button
                       onClick={handleSaveProfile}
                       disabled={isSaving}
                     >
                       {isSaving ? "Saving..." : "Save Changes"}
                     </Button>
                   </div>
                 )}
              </CardContent>
            </Card>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <IconUser className="h-5 w-5" />
                     Account Information
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">User ID</span>
                     <span className="text-sm font-medium">{profile.id}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Join Date</span>
                     <span className="text-sm font-medium">
                       {new Date(profile.joinDate).toLocaleDateString()}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Last Login</span>
                     <span className="text-sm font-medium">
                       {new Date(profile.lastLogin).toLocaleString()}
                     </span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Status</span>
                     <Badge variant={profile.status === "active" ? "default" : "secondary"}>
                       {profile.status}
                     </Badge>
                   </div>
                 </CardContent>
               </Card>

               {profile.firstName && (
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <IconUser className="h-5 w-5" />
                       Employee Information
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex justify-between">
                       <span className="text-sm text-muted-foreground">Full Name</span>
                       <span className="text-sm font-medium">
                         {profile.firstName} {profile.middleName} {profile.lastName}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-muted-foreground">Phone</span>
                       <span className="text-sm font-medium">{profile.phone}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-muted-foreground">Designation</span>
                       <span className="text-sm font-medium">{profile.designation || 'Not assigned'}</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-sm text-muted-foreground">Location</span>
                       <span className="text-sm font-medium">
                         {profile.city && profile.state ? `${profile.city}, ${profile.state}` : profile.country || 'Not specified'}
                       </span>
                     </div>
                   </CardContent>
                 </Card>
               )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconBuilding className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Company</span>
                    <span className="text-sm font-medium">SND Rental Management</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Department</span>
                    <span className="text-sm font-medium">{profile.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <span className="text-sm font-medium">{profile.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm font-medium">{profile.location}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in the browser
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, pushNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, smsNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive marketing and promotional emails
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, marketingEmails: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive security and account alerts
                      </p>
                    </div>
                    <Switch
                      checked={notifications.securityAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, securityAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly performance reports
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, weeklyReports: checked })
                      }
                    />
                  </div>
                </div>

                                 <div className="flex justify-end">
                   <Button onClick={handleSaveNotifications} disabled={isSaving}>
                     {isSaving ? "Saving..." : "Save Preferences"}
                   </Button>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPalette className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize your interface appearance and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={appearance.theme}
                      onValueChange={(value) =>
                        setAppearance({ ...appearance, theme: value as "light" | "dark" | "system" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={appearance.language}
                      onValueChange={(value) =>
                        setAppearance({ ...appearance, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={appearance.timezone}
                      onValueChange={(value) =>
                        setAppearance({ ...appearance, timezone: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select
                      value={appearance.dateFormat}
                      onValueChange={(value) =>
                        setAppearance({ ...appearance, dateFormat: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                                 <div className="flex justify-end">
                   <Button onClick={handleSaveAppearance} disabled={isSaving}>
                     {isSaving ? "Saving..." : "Save Settings"}
                   </Button>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Change Password</h4>
                      <p className="text-sm text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <IconKey className="h-4 w-4 mr-2" />
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <IconShield className="h-4 w-4 mr-2" />
                      Enable
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Active Sessions</h4>
                      <p className="text-sm text-muted-foreground">
                        View and manage your active sessions
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Login History</h4>
                      <p className="text-sm text-muted-foreground">
                        Review your recent login activity
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="p-4 border border-destructive rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-destructive">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <IconTrash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Account</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                                                     <Button
                             variant="destructive"
                             onClick={handleDeleteAccount}
                             disabled={isSaving}
                           >
                             {isSaving ? "Deleting..." : "Delete Account"}
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
  )
}
