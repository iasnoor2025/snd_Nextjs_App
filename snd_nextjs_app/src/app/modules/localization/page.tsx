'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Globe, Settings, Languages, FileText, Upload, Download, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '@/lib/api';
import { useTranslations } from 'next-intl';

interface Language {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface Translation {
  id: string;
  key: string;
  value: string;
  locale: string;
  group: string;
}

export default function LocalizationPage() {
  const t = useTranslations('localization');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/localization/languages') as any;
      if (response.success) {
        setLanguages(response.data || []);
      } else {
        console.error('Failed to fetch languages');
        setLanguages([]);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      setLanguages([]);
      toast.error(t('languages.failedToAddLanguage'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTranslations = async (locale?: string, group?: string) => {
    try {
      setLoading(true);
      let url = '/localization/translations';
      if (locale) url += `?locale=${locale}`;
      if (group) url += `${locale ? '&' : '?'}group=${group}`;
      
      const response = await apiService.get(url) as any;
      if (response.success) {
        setTranslations(response.data || []);
      } else {
        console.error('Failed to fetch translations');
        setTranslations([]);
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
      setTranslations([]);
      toast.error('Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      toast.error(t('general.error'));
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post('/localization/languages', formData) as any;
      
      if (response.success) {
        toast.success(t('languages.languageAdded'));
        setFormData({ name: '', code: '', is_active: true, is_default: false });
        fetchLanguages();
      } else {
        toast.error(response.message || t('languages.failedToAddLanguage'));
      }
    } catch (error) {
      console.error('Error adding language:', error);
      toast.error(t('languages.failedToAddLanguage'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLanguageStatus = async (languageId: string, isActive: boolean) => {
    try {
      const response = await apiService.put(`/localization/languages/${languageId}`, {
        is_active: !isActive
      }) as any;
      
      if (response.success) {
        toast.success(t('languages.languageUpdated'));
        fetchLanguages();
      } else {
        toast.error(t('languages.failedToUpdateLanguage'));
      }
    } catch (error) {
      console.error('Error updating language status:', error);
      toast.error(t('languages.failedToUpdateLanguage'));
    }
  };

  const handleDeleteLanguage = async (languageId: string) => {
    if (!confirm(t('languages.confirmDeleteLanguage'))) return;
    
    try {
      const response = await apiService.delete(`/localization/languages/${languageId}`) as any;
      
      if (response.success) {
        toast.success(t('languages.languageDeleted'));
        fetchLanguages();
      } else {
        toast.error(t('languages.failedToDeleteLanguage'));
      }
    } catch (error) {
      console.error('Error deleting language:', error);
      toast.error(t('languages.failedToDeleteLanguage'));
    }
  };

  const handleImportTranslations = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      const response = await apiService.post('/localization/translations/import', formData) as any;
      
      if (response.success) {
        toast.success(t('translations.translationsImported'));
        fetchTranslations();
      } else {
        toast.error(t('translations.failedToImportTranslations'));
      }
    } catch (error) {
      console.error('Error importing translations:', error);
      toast.error(t('translations.failedToImportTranslations'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportTranslations = async (locale?: string) => {
    try {
      setLoading(true);
      let url = '/localization/translations/export';
      if (locale) url += `/${locale}`;
      
      const response = await apiService.get(url) as any;
      
      if (response.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translations${locale ? `_${locale}` : ''}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(t('translations.translationsExported'));
      } else {
        toast.error(t('translations.failedToExportTranslations'));
      }
    } catch (error) {
      console.error('Error exporting translations:', error);
      toast.error(t('translations.failedToExportTranslations'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Languages Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Languages className="h-5 w-5" />
              <span>{t('languages.title')}</span>
            </CardTitle>
            <CardDescription>{t('languages.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Language Form */}
            <form onSubmit={handleAddLanguage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language_name">{t('languages.languageName')}</Label>
                  <Input
                    id="language_name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., English"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language_code">{t('languages.languageCode')}</Label>
                  <Input
                    id="language_code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., en"
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="is_active">{t('languages.active')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  />
                  <Label htmlFor="is_default">{t('languages.default')}</Label>
                </div>
              </div>
              
              <Button type="submit" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {t('languages.addLanguage')}
              </Button>
            </form>

            <Separator />

            {/* Languages List */}
            <div className="space-y-2">
              <Label>{t('languages.currentLanguages')}</Label>
              <div className="space-y-2">
                {languages.map((language) => (
                  <div key={language.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium">{language.name}</div>
                        <div className="text-sm text-muted-foreground">{language.code}</div>
                      </div>
                      <div className="flex space-x-1">
                        {language.is_default && (
                          <Badge variant="secondary">{t('languages.default')}</Badge>
                        )}
                        {language.is_active ? (
                          <Badge variant="default">{t('languages.active')}</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLanguageStatus(language.id, language.is_active)}
                      >
                        {language.is_active ? t('languages.deactivate') : t('languages.activate')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLanguage(language.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Translations Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{t('translations.title')}</span>
            </CardTitle>
            <CardDescription>{t('translations.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('translations.language')}</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('translations.allLanguages')}</SelectItem>
                    {languages.map((language) => (
                      <SelectItem key={language.id} value={language.code}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('translations.group')}</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('translations.allGroups')}</SelectItem>
                    <SelectItem value="validation">{t('translations.validation')}</SelectItem>
                    <SelectItem value="auth">{t('translations.auth')}</SelectItem>
                    <SelectItem value="common">{t('translations.common')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Import/Export */}
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="import_file">{t('translations.importTranslations')}</Label>
                <Input
                  id="import_file"
                  type="file"
                  accept=".json"
                  onChange={handleImportTranslations}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                                  <Button
                    variant="outline"
                    onClick={() => handleExportTranslations()}
                    disabled={loading}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t('translations.exportAll')}
                  </Button>
                {selectedLanguage && (
                                      <Button
                      variant="outline"
                      onClick={() => handleExportTranslations(selectedLanguage)}
                      disabled={loading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('translations.exportLanguage', { language: selectedLanguage })}
                    </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Translations List */}
            <div className="space-y-2">
              <Label>{t('translations.currentTranslations')}</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {translations.map((translation) => (
                  <div key={translation.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{translation.key}</div>
                      <div className="text-sm text-muted-foreground">
                        {translation.value}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{translation.locale}</Badge>
                      <Badge variant="outline">{translation.group}</Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {translations.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('translations.noTranslations')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{t('settings.title')}</span>
          </CardTitle>
          <CardDescription>{t('settings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.defaultLanguage')}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.selectDefaultLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.filter(l => l.is_active).map((language) => (
                    <SelectItem key={language.id} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.fallbackLanguage')}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.selectFallbackLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.filter(l => l.is_active).map((language) => (
                    <SelectItem key={language.id} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="auto_detect" />
              <Label htmlFor="auto_detect">{t('settings.autoDetectBrowser')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="user_preference" />
              <Label htmlFor="user_preference">{t('settings.userPreference')}</Label>
            </div>
          </div>
          
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            {t('settings.saveSettings')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 