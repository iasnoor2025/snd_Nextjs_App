'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  ArrowLeft,
  Building2,
  Edit,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  User,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import DynamicDocumentTypeManager from '@/components/company/DynamicDocumentTypeManager';

interface Company {
  id: number;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo: string | null;
  // Saudi Law Required Documents
  commercial_registration: string | null;
  commercial_registration_expiry: string | null;
  tax_registration: string | null;
  tax_registration_expiry: string | null;
  municipality_license: string | null;
  municipality_license_expiry: string | null;
  chamber_of_commerce: string | null;
  chamber_of_commerce_expiry: string | null;
  labor_office_license: string | null;
  labor_office_license_expiry: string | null;
  gosi_registration: string | null;
  gosi_registration_expiry: string | null;
  saudi_standards_license: string | null;
  saudi_standards_license_expiry: string | null;
  environmental_license: string | null;
  environmental_license_expiry: string | null;
  // Additional Company Information
  website: string | null;
  contact_person: string | null;
  contact_person_phone: string | null;
  contact_person_email: string | null;
  company_type: string | null;
  industry: string | null;
  employee_count: number | null;
  // Legacy field for backward compatibility
  legal_document: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function CompanyDetailPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/companies/${params.id}`);
        const result = await response.json();

        if (result.success) {
          setCompany(result.data);
        } else {
          toast.error(result.message || t('company.messages.loadingError'));
          router.push('/modules/company-management');
        }
      } catch (error) {
        
        toast.error(t('company.messages.loadingError'));
        router.push('/modules/company-management');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCompany();
    }
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!company) return;

    if (confirm(t('company.messages.deleteConfirm'))) {
      try {
        const response = await fetch(`/api/companies/${company.id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (result.success) {
          toast.success(t('company.messages.deleteSuccess'));
          router.push('/modules/company-management');
        } else {
          toast.error(result.message || t('company.messages.deleteError'));
        }
      } catch (error) {
        
        toast.error(t('company.messages.deleteError'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('company.messages.loading')}</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('company.messages.companyNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Modern Header */}
      <div className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 backdrop-blur-sm border border-gray-200/50 shadow-lg">
        <div className="flex items-center space-x-4">
          <Link href="/modules/company-management">
            <Button variant="ghost" size="sm" className="hover:bg-white/60 dark:hover:bg-gray-800/60">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('company.actions.back')}
            </Button>
          </Link>
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-300/30 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {company.name}
            </h1>
            {company.industry && (
              <p className="text-sm text-muted-foreground mt-1">{company.industry}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/modules/company-management/${company.id}/edit`}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Edit className="h-4 w-4 mr-2" />
              {t('company.actions.edit')}
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('company.actions.delete')}
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Information - Consolidated */}
        <Card className="lg:col-span-2 hover:shadow-xl transition-all duration-300 border border-gray-200/50 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-300/30">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {company.email && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.email')}</label>
                      <p className="text-sm font-semibold mt-1 break-all">{company.email}</p>
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 dark:bg-green-500/20">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.phone')}</label>
                      <p className="text-sm font-semibold mt-1">{company.phone}</p>
                    </div>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                      <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.website')}</label>
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold mt-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block break-all">
                        {company.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {company.address && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 dark:bg-orange-500/20">
                      <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.address')}</label>
                      <p className="text-sm font-semibold mt-1">{company.address}</p>
                    </div>
                  </div>
                )}

                {company.company_type && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.companyType')}</label>
                    <p className="text-sm font-semibold mt-1">{company.company_type}</p>
                  </div>
                )}

                {company.employee_count !== null && company.employee_count !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.employeeCount')}</label>
                    <p className="text-sm font-semibold mt-1">{company.employee_count}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Person Section */}
            {(company.contact_person || company.contact_person_phone || company.contact_person_email) && (
              <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Person
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.contact_person && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.contactPerson')}</label>
                      <p className="text-sm font-semibold mt-1">{company.contact_person}</p>
                    </div>
                  )}
                  {company.contact_person_phone && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.contactPersonPhone')}</label>
                      <p className="text-sm font-semibold mt-1">{company.contact_person_phone}</p>
                    </div>
                  )}
                  {company.contact_person_email && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('company.fields.contactPersonEmail')}</label>
                      <p className="text-sm font-semibold mt-1 break-all">{company.contact_person_email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
            <CardTitle className="text-lg">Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {company.created_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created</label>
                <p className="text-sm font-semibold mt-1">{new Date(company.created_at).toLocaleDateString()}</p>
              </div>
            )}
            {company.updated_at && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</label>
                <p className="text-sm font-semibold mt-1">{new Date(company.updated_at).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saudi Law Required Documents */}
      <Card className="w-full hover:shadow-xl transition-all duration-300 border border-gray-200/50 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 backdrop-blur-sm">
        <CardHeader className="pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <CardTitle className="flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-sm border border-red-300/30">
              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            Saudi Law Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Registration Numbers */}
            <div className="space-y-4">
              {company.commercial_registration && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    Commercial Registration <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm font-semibold mt-1">{company.commercial_registration}</p>
                </div>
              )}
              {company.tax_registration && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    Tax Registration <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm font-semibold mt-1">{company.tax_registration}</p>
                </div>
              )}
              {company.municipality_license && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Municipality License</label>
                  <p className="text-sm font-semibold mt-1">{company.municipality_license}</p>
                </div>
              )}
              {company.chamber_of_commerce && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chamber of Commerce</label>
                  <p className="text-sm font-semibold mt-1">{company.chamber_of_commerce}</p>
                </div>
              )}
              {company.labor_office_license && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Labor Office License</label>
                  <p className="text-sm font-semibold mt-1">{company.labor_office_license}</p>
                </div>
              )}
              {company.gosi_registration && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">GOSI Registration</label>
                  <p className="text-sm font-semibold mt-1">{company.gosi_registration}</p>
                </div>
              )}
              {company.saudi_standards_license && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Saudi Standards License</label>
                  <p className="text-sm font-semibold mt-1">{company.saudi_standards_license}</p>
                </div>
              )}
              {company.environmental_license && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Environmental License</label>
                  <p className="text-sm font-semibold mt-1">{company.environmental_license}</p>
                </div>
              )}
            </div>

            {/* Right Column - Expiry Dates */}
            <div className="space-y-4">
              {company.commercial_registration_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Commercial Registration Expiry
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-sm font-semibold ${
                      new Date(company.commercial_registration_expiry) < new Date()
                        ? 'text-red-600 dark:text-red-400'
                        : new Date(company.commercial_registration_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {new Date(company.commercial_registration_expiry).toLocaleDateString()}
                    </p>
                    {new Date(company.commercial_registration_expiry) < new Date() && (
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                </div>
              )}
              {company.tax_registration_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Tax Registration Expiry
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-sm font-semibold ${
                      new Date(company.tax_registration_expiry) < new Date()
                        ? 'text-red-600 dark:text-red-400'
                        : new Date(company.tax_registration_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {new Date(company.tax_registration_expiry).toLocaleDateString()}
                    </p>
                    {new Date(company.tax_registration_expiry) < new Date() && (
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                </div>
              )}
              {company.municipality_license_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Municipality License Expiry
                  </label>
                  <p className="text-sm font-semibold mt-1">{new Date(company.municipality_license_expiry).toLocaleDateString()}</p>
                </div>
              )}
              {company.chamber_of_commerce_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Chamber of Commerce Expiry
                  </label>
                  <p className="text-sm font-semibold mt-1">{new Date(company.chamber_of_commerce_expiry).toLocaleDateString()}</p>
                </div>
              )}
              {company.labor_office_license_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Labor Office License Expiry
                  </label>
                  <p className="text-sm font-semibold mt-1">{new Date(company.labor_office_license_expiry).toLocaleDateString()}</p>
                </div>
              )}
              {company.gosi_registration_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    GOSI Registration Expiry
                  </label>
                  <p className="text-sm font-semibold mt-1">{new Date(company.gosi_registration_expiry).toLocaleDateString()}</p>
                </div>
              )}
              {company.saudi_standards_license_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Saudi Standards License Expiry
                  </label>
                  <p className="text-sm font-semibold mt-1">{new Date(company.saudi_standards_license_expiry).toLocaleDateString()}</p>
                </div>
              )}
              {company.environmental_license_expiry && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Environmental License Expiry
                  </label>
                  <p className="text-sm font-semibold mt-1">{new Date(company.environmental_license_expiry).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {!company.commercial_registration && !company.tax_registration && 
           !company.municipality_license && !company.chamber_of_commerce && 
           !company.labor_office_license && !company.gosi_registration && 
           !company.saudi_standards_license && !company.environmental_license && (
            <p className="text-sm text-gray-500 text-center py-8">No Saudi Law documents registered yet</p>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Document Types - Full Width Section */}
      <div className="w-full">
        <DynamicDocumentTypeManager />
      </div>
    </div>
  );
}
