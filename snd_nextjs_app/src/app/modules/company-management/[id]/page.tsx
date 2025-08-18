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
  Image,
  Mail,
  MapPin,
  Phone,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: number;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  logo: string | null;
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
        console.error('Error fetching company:', error);
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
        console.error('Error deleting company:', error);
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
          </CardContent>
        </Card>

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
