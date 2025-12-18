'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ApiService from '@/lib/api-service';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '@/hooks/use-i18n';
import { ProtectedRoute } from '@/components/protected-route';
import { clearSettingsCache } from '@/hooks/use-settings';

interface Setting {
  key: string;
  value: string | null;
  type: string;
  description?: string | null;
  category: string;
}

export default function SettingsPage() {
  const { t } = useI18n();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/login`);
      return;
    }

    if (status === 'authenticated') {
      loadSettings();
    }
  }, [status, router, locale]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getSettings();
      if (response.settings) {
        setSettings(response.settings);
        // Set logo preview
        const logoSetting = response.settings.find((s: Setting) => s.key === 'company.logo');
        if (logoSetting?.value) {
          setLogoPreview(logoSetting.value);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string | null) => {
    setSettings(prev =>
      prev.map(s => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ApiService.updateSettings({ settings });
      // Clear settings cache so changes are reflected immediately
      clearSettingsCache();
      toast.success('Settings updated successfully');
      // Reload settings to show updated values
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'company');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const logoUrl = data.url;

      updateSetting('company.logo', logoUrl);
      setLogoPreview(logoUrl);

      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    }
  };

  const companySettings = settings.filter(s => s.category === 'company');
  const financialSettings = settings.filter(s => s.category === 'financial');
  const localeSettings = settings.filter(s => s.category === 'locale');
  const appSettings = settings.filter(s => s.category === 'app');
  const emailSettings = settings.filter(s => s.category === 'email');
  const integrationSettings = settings.filter(s => s.category === 'integration');
  const payrollSettings = settings.filter(s => s.category === 'payroll');
  const systemSettings = settings.filter(s => s.category === 'system');
  const otherSettings = settings.filter(s => !['company', 'financial', 'locale', 'app', 'email', 'integration', 'payroll', 'system'].includes(s.category));

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="SUPER_ADMIN">
      <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage application settings</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <Tabs defaultValue="company" className="space-y-4">
            <TabsList className="inline-flex w-full overflow-x-auto">
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="locale">Regional</TabsTrigger>
              <TabsTrigger value="app">Application</TabsTrigger>
              {emailSettings.length > 0 && (
                <TabsTrigger value="email">Email</TabsTrigger>
              )}
              {integrationSettings.length > 0 && (
                <TabsTrigger value="integration">Integration</TabsTrigger>
              )}
              {payrollSettings.length > 0 && (
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
              )}
              {systemSettings.length > 0 && (
                <TabsTrigger value="system">System</TabsTrigger>
              )}
              {otherSettings.length > 0 && (
                <TabsTrigger value="other">Other</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>Configure company details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative h-20 w-20 border rounded-lg overflow-hidden">
                          <Image
                            src={logoPreview}
                            alt="Company Logo"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 border rounded-lg flex items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="max-w-xs"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload a logo image (max 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Name */}
                  {companySettings
                    .filter(s => s.key === 'company.name')
                    .map(setting => (
                      <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key}>
                          {setting.description || 'Company Name'}
                        </Label>
                        <Input
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      </div>
                    ))}

                  {/* Other Company Settings */}
                  {companySettings
                    .filter(s => s.key !== 'company.name' && s.key !== 'company.logo')
                    .map(setting => (
                      <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key}>
                          {setting.description || setting.key.replace('company.', '')}
                        </Label>
                        {setting.type === 'textarea' ? (
                          <Textarea
                            id={setting.key}
                            value={setting.value || ''}
                            onChange={e => updateSetting(setting.key, e.target.value)}
                            rows={3}
                          />
                        ) : setting.key.includes('website') || setting.key.includes('facebook') || setting.key.includes('twitter') || setting.key.includes('linkedin') ? (
                          <Input
                            id={setting.key}
                            type="url"
                            value={setting.value || ''}
                            onChange={e => updateSetting(setting.key, e.target.value)}
                            placeholder="https://..."
                          />
                        ) : (
                          <Input
                            id={setting.key}
                            type={setting.type === 'email' ? 'email' : setting.type === 'tel' ? 'tel' : 'text'}
                            value={setting.value || ''}
                            onChange={e => updateSetting(setting.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Settings</CardTitle>
                  <CardDescription>Configure currency, tax, and payment settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {financialSettings.map(setting => (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>
                        {setting.description || setting.key.replace('financial.', '').replace('currency.', '')}
                      </Label>
                      {setting.type === 'textarea' ? (
                        <Textarea
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                          rows={4}
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          type={setting.key.includes('Rate') || setting.key.includes('Terms') || setting.key.includes('Size') ? 'number' : 'text'}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locale" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Regional Settings</CardTitle>
                  <CardDescription>Configure timezone, date formats, and locale preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {localeSettings.map(setting => (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>
                        {setting.description || setting.key.replace('locale.', '').replace('display.', '')}
                      </Label>
                      {setting.key.includes('numberFormat') || setting.key.includes('currencyFormat') ? (
                        <Input
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                          placeholder={setting.key.includes('numberFormat') ? 'e.g., en-US, ar-SA' : 'e.g., standard, compact'}
                        />
                      ) : setting.key.includes('decimalPlaces') ? (
                        <Input
                          id={setting.key}
                          type="number"
                          min="0"
                          max="10"
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                          placeholder={setting.key.includes('timezone') ? 'e.g., Asia/Riyadh' : setting.key.includes('Format') ? 'e.g., YYYY-MM-DD' : ''}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="app" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>Configure application preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {appSettings.map(setting => (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>
                        {setting.description || setting.key.replace('app.', '').replace('notification.', '')}
                      </Label>
                      {setting.key.includes('includeLogo') || setting.key.includes('Enabled') || setting.key.includes('autoApprove') || setting.key.includes('allowEdit') ? (
                        <select
                          id={setting.key}
                          value={setting.value || 'false'}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : setting.key.includes('PageSize') || setting.key.includes('submissionDeadline') ? (
                        <Input
                          id={setting.key}
                          type="number"
                          min="1"
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      ) : (
                        <Input
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {emailSettings.length > 0 && (
              <TabsContent value="email" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Settings</CardTitle>
                    <CardDescription>Configure email sender and notification settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {emailSettings.map(setting => (
                      <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key}>
                          {setting.description || setting.key.replace('email.', '')}
                        </Label>
                        <Input
                          id={setting.key}
                          type={setting.key.includes('Expiry') ? 'number' : 'text'}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                          placeholder={setting.key.includes('Expiry') ? 'Seconds (e.g., 3600 for 1 hour)' : ''}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {integrationSettings.length > 0 && (
              <TabsContent value="integration" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Integration Settings</CardTitle>
                    <CardDescription>Configure ERPNext and external system integration settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {integrationSettings.map(setting => (
                      <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key}>
                          {setting.description || setting.key.replace('erpnext.', '')}
                        </Label>
                        <Input
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {payrollSettings.length > 0 && (
              <TabsContent value="payroll" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Payroll Settings</CardTitle>
                    <CardDescription>Configure default payroll calculation rules</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {payrollSettings.map(setting => (
                      <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key}>
                          {setting.description || setting.key.replace('payroll.', '')}
                        </Label>
                        <Input
                          id={setting.key}
                          type="number"
                          step={setting.key.includes('Multiplier') ? '0.1' : '1'}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {systemSettings.length > 0 && (
              <TabsContent value="system" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Configure cache, rate limiting, and security settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-6">
                      {/* Cache Settings */}
                      {systemSettings.filter(s => s.key.startsWith('cache.')).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Cache Settings</h3>
                          {systemSettings
                            .filter(s => s.key.startsWith('cache.'))
                            .map(setting => (
                              <div key={setting.key} className="space-y-2">
                                <Label htmlFor={setting.key}>
                                  {setting.description || setting.key.replace('cache.', '')}
                                </Label>
                                <Input
                                  id={setting.key}
                                  type="number"
                                  value={setting.value || ''}
                                  onChange={e => updateSetting(setting.key, e.target.value)}
                                  placeholder="Milliseconds"
                                />
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Rate Limiting Settings */}
                      {systemSettings.filter(s => s.key.startsWith('ratelimit.')).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Rate Limiting</h3>
                          {systemSettings
                            .filter(s => s.key.startsWith('ratelimit.'))
                            .map(setting => (
                              <div key={setting.key} className="space-y-2">
                                <Label htmlFor={setting.key}>
                                  {setting.description || setting.key.replace('ratelimit.', '')}
                                </Label>
                                <Input
                                  id={setting.key}
                                  type="number"
                                  value={setting.value || ''}
                                  onChange={e => updateSetting(setting.key, e.target.value)}
                                  placeholder={setting.key.includes('window') ? 'Milliseconds' : 'Requests'}
                                />
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Security Settings */}
                      {systemSettings.filter(s => s.key.startsWith('security.')).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Security Settings</h3>
                          {systemSettings
                            .filter(s => s.key.startsWith('security.'))
                            .map(setting => (
                              <div key={setting.key} className="space-y-2">
                                <Label htmlFor={setting.key}>
                                  {setting.description || setting.key.replace('security.', '')}
                                </Label>
                                {setting.key.includes('requireStrongPassword') ? (
                                  <select
                                    id={setting.key}
                                    value={setting.value || 'false'}
                                    onChange={e => updateSetting(setting.key, e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                  >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                  </select>
                                ) : (
                                  <Input
                                    id={setting.key}
                                    type={setting.key.includes('Timeout') ? 'number' : 'text'}
                                    value={setting.value || ''}
                                    onChange={e => updateSetting(setting.key, e.target.value)}
                                    placeholder={setting.key.includes('Timeout') ? 'Milliseconds' : ''}
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {otherSettings.length > 0 && (
              <TabsContent value="other" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Other Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {otherSettings.map(setting => (
                      <div key={setting.key} className="space-y-2">
                        <Label htmlFor={setting.key}>
                          {setting.description || setting.key}
                        </Label>
                        <Input
                          id={setting.key}
                          value={setting.value || ''}
                          onChange={e => updateSetting(setting.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
    </ProtectedRoute>
  );
}

