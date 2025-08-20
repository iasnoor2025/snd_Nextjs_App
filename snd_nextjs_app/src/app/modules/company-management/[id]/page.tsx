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
  Image,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import CompanyDocumentManager from '@/components/company/CompanyDocumentManager';

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
          toast.error(result.message || 'Failed to fetch company');
          router.push('/modules/company-management');
        }
      } catch (error) {
        
        toast.error('Failed to fetch company');
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

    if (confirm('Are you sure you want to delete this company?')) {
      try {
        const response = await fetch(`/api/companies/${company.id}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (result.success) {
          toast.success('Company deleted successfully');
          router.push('/modules/company-management');
        } else {
          toast.error(result.message || 'Failed to delete company');
        }
      } catch (error) {
        
        toast.error('Failed to delete company');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading company...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Company not found</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/modules/company-management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">{company.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/modules/company-management/${company.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Company Name</label>
              <p className="text-lg font-semibold">{company.name}</p>
            </div>

            {company.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm">{company.email}</p>
                </div>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{company.phone}</p>
                </div>
              </div>
            )}

            {company.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm">{company.address}</p>
                </div>
              </div>
            )}

            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Website</label>
                  <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      {company.website}
                    </a>
                  </p>
                </div>
              </div>
            )}

            {company.company_type && (
              <div>
                <label className="text-sm font-medium text-gray-500">Company Type</label>
                <p className="text-sm">{company.company_type}</p>
              </div>
            )}

            {company.industry && (
              <div>
                <label className="text-sm font-medium text-gray-500">Industry</label>
                <p className="text-sm">{company.industry}</p>
              </div>
            )}

            {company.employee_count && (
              <div>
                <label className="text-sm font-medium text-gray-500">Employee Count</label>
                <p className="text-sm">{company.employee_count}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Person Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Person
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.contact_person && (
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Person</label>
                <p className="text-sm font-semibold">{company.contact_person}</p>
              </div>
            )}

            {company.contact_person_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                  <p className="text-sm">{company.contact_person_phone}</p>
                </div>
              </div>
            )}

            {company.contact_person_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Email</label>
                  <p className="text-sm">{company.contact_person_email}</p>
                </div>
              </div>
            )}

            {!company.contact_person && !company.contact_person_phone && !company.contact_person_email && (
              <p className="text-sm text-gray-500">No contact person information available</p>
            )}
          </CardContent>
        </Card>

        {/* Saudi Law Required Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              Saudi Law Required Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.commercial_registration && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Commercial Registration</label>
                  <p className="text-sm font-semibold">{company.commercial_registration}</p>
                  {company.commercial_registration_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.commercial_registration_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {company.tax_registration && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax Registration</label>
                  <p className="text-sm font-semibold">{company.tax_registration}</p>
                  {company.tax_registration_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.tax_registration_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {company.municipality_license && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Municipality License</label>
                  <p className="text-sm font-semibold">{company.municipality_license}</p>
                  {company.municipality_license_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.municipality_license_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {company.chamber_of_commerce && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Chamber of Commerce</label>
                  <p className="text-sm font-semibold">{company.chamber_of_commerce}</p>
                  {company.chamber_of_commerce_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.chamber_of_commerce_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {company.labor_office_license && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Labor Office License</label>
                  <p className="text-sm font-semibold">{company.labor_office_license}</p>
                  {company.labor_office_license_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.labor_office_license_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {company.gosi_registration && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">GOSI Registration</label>
                  <p className="text-sm font-semibold">{company.gosi_registration}</p>
                  {company.gosi_registration_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.gosi_registration_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {company.saudi_standards_license && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Saudi Standards License</label>
                  <p className="text-sm font-semibold">{company.saudi_standards_license}</p>
                  {company.saudi_standards_license_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.saudi_standards_license_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {company.environmental_license && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Environmental License</label>
                  <p className="text-sm font-semibold">{company.environmental_license}</p>
                  {company.environmental_license_expiry && (
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(company.environmental_license_expiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!company.commercial_registration && !company.tax_registration && 
             !company.municipality_license && !company.chamber_of_commerce && 
             !company.labor_office_license && !company.gosi_registration && 
             !company.saudi_standards_license && !company.environmental_license && (
              <p className="text-sm text-gray-500">No Saudi law required documents available</p>
            )}
          </CardContent>
        </Card>

        {/* Legacy Documents & Files */}
        <Card>
          <CardHeader>
            <CardTitle>Documents & Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.logo && (
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Logo</label>
                  <p className="text-sm text-blue-600 hover:underline cursor-pointer">View Logo</p>
                </div>
              </div>
            )}

            {company.legal_document && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Legal Document</label>
                  <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                    View Document
                  </p>
                </div>
              </div>
            )}

            {!company.logo && !company.legal_document && (
              <p className="text-sm text-gray-500">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Company Document Manager */}
        <CompanyDocumentManager 
          companyId={company.id} 
          companyName={company.name}
        />

        <Card>
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.created_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{new Date(company.created_at).toLocaleString()}</p>
              </div>
            )}

            {company.updated_at && (
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm">{new Date(company.updated_at).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
