'use client';

import { PermissionBased } from '@/components/PermissionBased';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useI18n } from '@/hooks/use-i18n';
import { PDFGenerator } from '@/lib/utils/pdf-generator';

import { Download, Edit, Plus, Search, Wrench, FileText, Shield, Award, MapPin, ClipboardCheck, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface EquipmentData {
  id: number;
  equipmentName: string;
  equipmentNumber?: string;
  doorNumber?: string;
  manufacturer?: string;
  modelNumber?: string;
  categoryId?: number;
  categoryName?: string;
  status: 'available' | 'expired' | 'expiring' | 'missing';
  istimaraExpiry?: string;
  daysRemaining: number | null;
  istimara?: string;
  insurance?: string;
  insuranceExpiry?: string;
  tuvCard?: string;
  tuvCardExpiry?: string;
  gpsExpiry?: string;
  periodicExaminationExpiry?: string;
  warrantyExpiry?: string;
  assignedTo?: number;
  driverName?: string;
  driverFileNumber?: string;
  // Dynamic fields for document type switching
  documentNumber?: string | null;
  documentExpiry?: string | null;
}

interface EquipmentSectionProps {
  equipmentData: EquipmentData[];
  onUpdateEquipment: (equipment: EquipmentData) => void;
  onHideSection: () => void;
  selectedDocumentType?: 'istimara' | 'insurance' | 'tuv' | 'gps' | 'periodicExamination' | 'warranty';
  onDocumentTypeChange?: (type: 'istimara' | 'insurance' | 'tuv' | 'gps' | 'periodicExamination' | 'warranty') => void;
}

export function EquipmentSection({
  equipmentData,
  onUpdateEquipment,
  onHideSection,
  selectedDocumentType = 'istimara',
  onDocumentTypeChange,
}: EquipmentSectionProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Document type configuration
  const documentTypes = {
    istimara: {
      label: 'Plate # Management',
      subtitle: 'Monitor and manage equipment Plate # status and expiry dates',
      icon: FileText,
      numberField: 'istimara',
      expiryField: 'istimaraExpiry',
      numberLabel: 'Plate #',
    },
    insurance: {
      label: 'Insurance Management',
      subtitle: 'Monitor and manage equipment Insurance status and expiry dates',
      icon: Shield,
      numberField: 'insurance',
      expiryField: 'insuranceExpiry',
      numberLabel: 'Insurance #',
    },
    tuv: {
      label: 'TUV Card Management',
      subtitle: 'Monitor and manage equipment TUV Card status and expiry dates',
      icon: Award,
      numberField: 'tuvCard',
      expiryField: 'tuvCardExpiry',
      numberLabel: 'TUV #',
    },
    gps: {
      label: 'GPS Management',
      subtitle: 'Monitor and manage equipment GPS expiry dates',
      icon: MapPin,
      numberField: null, // GPS doesn't have a number field
      expiryField: 'gpsExpiry',
      numberLabel: 'GPS',
    },
    periodicExamination: {
      label: 'Periodic Examination Management',
      subtitle: 'Monitor and manage equipment Periodic Examination expiry dates',
      icon: ClipboardCheck,
      numberField: null, // Periodic Examination doesn't have a number field
      expiryField: 'periodicExaminationExpiry',
      numberLabel: 'Periodic Examination',
    },
    warranty: {
      label: 'Warranty Management',
      subtitle: 'Monitor and manage equipment Warranty expiry dates',
      icon: Package,
      numberField: null, // Warranty doesn't have a number field
      expiryField: 'warrantyExpiry',
      numberLabel: 'Warranty',
    },
  };

  // Validate selectedDocumentType
  const validDocumentTypes = ['istimara', 'insurance', 'tuv', 'gps', 'periodicExamination', 'warranty'];
  const safeSelectedDocumentType = validDocumentTypes.includes(selectedDocumentType) ? selectedDocumentType : 'istimara';

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, driverFilter, typeFilter, search, safeSelectedDocumentType]);

  // Ensure equipmentData is always an array with robust type checking
  const safeEquipmentData = Array.isArray(equipmentData) ? equipmentData : [];

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/equipment/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setCategories(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch equipment categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Get unique categories from equipment data (fallback if API fails)
  const uniqueCategoriesFromData = Array.from(
    new Set(
      safeEquipmentData
        .map(item => item.categoryName)
        .filter((name): name is string => !!name)
    )
  ).map((name, index) => ({ id: index + 1000, name }));

  // Use categories from API, fallback to unique categories from data
  const availableCategories = categories.length > 0 ? categories : uniqueCategoriesFromData;

  // Filter and transform data based on selected document type
  const getCurrentDocumentData = () => {
    const docType = documentTypes[safeSelectedDocumentType];
    if (!docType) return safeEquipmentData;
    
    const numberField = docType.numberField;
    const expiryField = docType.expiryField;
    
    return safeEquipmentData.map(item => {
      // Get document-specific data
      const documentNumber = numberField ? (item[numberField as keyof EquipmentData] as string | null) : null;
      const documentExpiry = item[expiryField as keyof EquipmentData] as string | null;
      
      // Calculate status based on expiry
      const today = new Date();
      let status: 'available' | 'expired' | 'expiring' | 'missing' = 'available';
      let daysRemaining: number | null = null;

      // For document types without number fields (GPS, Periodic Examination, Warranty),
      // only check expiry date. For others, require both number and expiry.
      if (numberField) {
        // Document types with number fields (Plate #, Insurance, TUV)
        if (!documentNumber || !documentExpiry) {
          status = 'missing';
        } else {
          const expiryDate = new Date(documentExpiry);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            status = 'expired';
            daysRemaining = diffDays;
          } else if (diffDays <= 30) {
            status = 'expiring';
            daysRemaining = diffDays;
          } else {
            status = 'available';
            daysRemaining = diffDays;
          }
        }
      } else {
        // Document types without number fields (GPS, Periodic Examination, Warranty)
        if (!documentExpiry) {
          status = 'missing';
        } else {
          const expiryDate = new Date(documentExpiry);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            status = 'expired';
            daysRemaining = diffDays;
          } else if (diffDays <= 30) {
            status = 'expiring';
            daysRemaining = diffDays;
          } else {
            status = 'available';
            daysRemaining = diffDays;
          }
        }
      }

      return {
        ...item,
        documentNumber,
        documentExpiry,
        status,
        daysRemaining,
      };
    });
  };

  const currentDocumentData = getCurrentDocumentData();

  // Filter and search logic
  const filteredData = currentDocumentData.filter(item => {
    const docType = documentTypes[safeSelectedDocumentType];
    
    // Status filtering - show all expired items when "expired" is selected
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    const matchesDriver = driverFilter === 'all' || 
      (driverFilter === 'assigned' && item.driverName) ||
      (driverFilter === 'unassigned' && !item.driverName);
    
    const matchesType = typeFilter === 'all' || 
      (item.categoryName && item.categoryName.toUpperCase().trim() === typeFilter.toUpperCase().trim());
    
    const matchesSearch =
      !search ||
      item.equipmentName?.toLowerCase().includes(search.toLowerCase()) ||
      item.equipmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.doorNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      item.modelNumber?.toLowerCase().includes(search.toLowerCase()) ||
      (item.documentNumber && item.documentNumber.toLowerCase().includes(search.toLowerCase())) ||
      item.driverName?.toLowerCase().includes(search.toLowerCase()) ||
      item.driverFileNumber?.toLowerCase().includes(search.toLowerCase());

    // Smart filtering based on document type
    if (search) {
      // When searching, show all matches regardless of document status, but still respect type filter
      return matchesSearch && matchesType;
    }
    
    if (statusFilter === 'missing') {
      // Show only equipment without this document type
      const hasDocumentNumber = docType.numberField 
        ? (item.documentNumber && item.documentNumber !== 'N/A' && item.documentNumber.trim() !== '')
        : true; // For types without number fields, only check expiry
      const hasExpiryDate = item.documentExpiry && item.documentExpiry.trim() !== '';
      return !hasExpiryDate && item.status === 'missing' && matchesType && matchesDriver;
    }
    
    if (statusFilter === 'all') {
      // Show only equipment that have this document type (excluding missing status)
      const hasDocumentNumber = docType.numberField 
        ? (item.documentNumber && item.documentNumber !== 'N/A' && item.documentNumber.trim() !== '')
        : true; // For types without number fields, only check expiry
      const hasExpiryDate = item.documentExpiry && item.documentExpiry.trim() !== '';
      return hasExpiryDate && matchesType && matchesDriver; // Include type and driver filters
    }
    
    // For specific status filters (expired, expiring, available)
    return matchesStatus && matchesDriver && matchesType && matchesSearch;
  });

  // Calculate dynamic filter options based on data after applying other filters
  // Status options based on current type and driver filters (excluding search)
  const statusOptionsData = currentDocumentData.filter(item => {
    const matchesDriver = driverFilter === 'all' || 
      (driverFilter === 'assigned' && item.driverName) ||
      (driverFilter === 'unassigned' && !item.driverName);
    const matchesType = typeFilter === 'all' || 
      (item.categoryName && item.categoryName.toUpperCase().trim() === typeFilter.toUpperCase().trim());
    return matchesDriver && matchesType;
  });
  const dynamicAvailableStatuses = Array.from(
    new Set(statusOptionsData.map(item => item.status).filter(Boolean))
  ).sort();

  // Type options based on current status and driver filters (excluding search)
  const typeOptionsData = currentDocumentData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDriver = driverFilter === 'all' || 
      (driverFilter === 'assigned' && item.driverName) ||
      (driverFilter === 'unassigned' && !item.driverName);
    return matchesStatus && matchesDriver;
  });
  const dynamicAvailableTypes = Array.from(
    new Set(
      typeOptionsData
        .map(item => item.categoryName)
        .filter((name): name is string => !!name)
    )
  ).sort();

  // Driver options based on current status and type filters (excluding search)
  const driverOptionsData = currentDocumentData.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || 
      (item.categoryName && item.categoryName.toUpperCase().trim() === typeFilter.toUpperCase().trim());
    return matchesStatus && matchesType;
  });
  const dynamicDriverOptions = {
    hasAssigned: driverOptionsData.some(item => item.driverName),
    hasUnassigned: driverOptionsData.some(item => !item.driverName),
  };

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Get expired equipment data for PDF generation based on current document type
  const expiredEquipmentData = filteredData.filter(item => item.status === 'expired');

  // Handle PDF download for expired equipment
  const handleDownloadExpiredPDF = async () => {
    if (expiredEquipmentData.length === 0) {
      alert(t('equipment.istimara.noExpiredRecords'));
      return;
    }
    try {
      const docType = documentTypes[safeSelectedDocumentType];
      const documentLabel = docType?.label.replace(' Management', '') || 'Document';
      await PDFGenerator.generateExpiredEquipmentReport(
        expiredEquipmentData,
        safeSelectedDocumentType,
        documentLabel
      );
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(t('equipment.istimara.pdfGenerationFailed'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const currentDocType = documentTypes[safeSelectedDocumentType];
                const IconComponent = currentDocType?.icon || FileText;
                return <IconComponent className="h-5 w-5" />;
              })()}
              {documentTypes[safeSelectedDocumentType]?.label || 'Equipment Document Management'}
              {expiredEquipmentData.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {expiredEquipmentData.length}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {documentTypes[safeSelectedDocumentType]?.subtitle || 'Monitor and manage equipment document status and expiry dates'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Document Type:</label>
              <Select value={safeSelectedDocumentType} onValueChange={(value: any) => onDocumentTypeChange?.(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="istimara">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Plate #
                    </div>
                  </SelectItem>
                  <SelectItem value="insurance">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Insurance
                    </div>
                  </SelectItem>
                  <SelectItem value="tuv">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      TUV Card
                    </div>
                  </SelectItem>
                  <SelectItem value="gps">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      GPS
                    </div>
                  </SelectItem>
                  <SelectItem value="periodicExamination">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Periodic Examination
                    </div>
                  </SelectItem>
                  <SelectItem value="warranty">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Warranty
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PermissionBased action="manage" subject="Equipment">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExpiredPDF}
                disabled={expiredEquipmentData.length === 0}
                className="flex items-center gap-2"
                title={expiredEquipmentData.length === 0 ? t('equipment.istimara.noExpiredRecordsToDownload') : t('equipment.istimara.downloadPdfReport', { count: expiredEquipmentData.length })}
              >
                <Download className="h-4 w-4" />
                {t('equipment.istimara.downloadPdf')} ({expiredEquipmentData.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/modules/equipment-management')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('equipment.actions.manageEquipment')}
              </Button>
            </PermissionBased>
            <Button
              variant="outline"
              size="sm"
              onClick={onHideSection}
              className="flex items-center gap-2"
            >
              {t('dashboard.hideSection')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('equipment.istimara.searchPlaceholderDashboard')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('equipment.istimara.allStatuses')}</option>
              {dynamicAvailableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === 'expired' 
                    ? t('equipment.istimara.expired')
                    : status === 'expiring'
                    ? t('equipment.istimara.expiringSoon')
                    : status === 'missing'
                    ? t('equipment.istimara.missing')
                    : t('equipment.istimara.available')}
                </option>
              ))}
            </select>
            <select
              value={driverFilter}
              onChange={e => setDriverFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('equipment.istimara.allDrivers')}</option>
              {dynamicDriverOptions.hasAssigned && (
                <option value="assigned">{t('equipment.istimara.assigned')}</option>
              )}
              {dynamicDriverOptions.hasUnassigned && (
                <option value="unassigned">{t('equipment.istimara.unassigned')}</option>
              )}
            </select>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-10 px-3 text-sm border border-input rounded-md bg-background"
            >
              <option value="all">{t('equipment.istimara.allTypes')}</option>
              {dynamicAvailableTypes.map((type) => (
                <option key={type} value={type.toUpperCase()}>
                  {type}
                </option>
              ))}
            </select>
            {(search || statusFilter !== 'all' || driverFilter !== 'all' || typeFilter !== 'all' || safeSelectedDocumentType !== 'istimara') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setDriverFilter('all');
                  setTypeFilter('all');
                  onDocumentTypeChange?.('istimara');
                }}
                className="h-10"
              >
                {t('equipment.istimara.clear')}
              </Button>
            )}
          </div>
        </div>

        {/* Equipment Table or Empty State */}
        {filteredData.length > 0 ? (
          <>
            <div className="rounded-lg border">
              <div className="p-4 border-b bg-muted/50">
                <h4 className="font-medium text-sm">
                  {t('equipment.istimara.allEquipment') || 'All Equipment'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {t('equipment.istimara.allEquipmentDescription') || 'Complete list of all equipment with istimara status'}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('equipment.istimara.tableHeaders.equipmentName')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.doorNumber') || 'Door #'}</TableHead>
                    <TableHead>{documentTypes[safeSelectedDocumentType]?.numberLabel || 'Document #'}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.driverOperator')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.status')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.expiryDate')}</TableHead>
                    <TableHead>{t('equipment.istimara.tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {(() => {
                              const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#14B8A6', '#F43F5E', '#6366F1'];
                              const colorIndex = (item.categoryId || 0) % colors.length;
                              return <span style={{ color: colors[colorIndex] }}>●</span>;
                            })()}
                          </span>
                          <div>
                            <div>{item.equipmentName}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.manufacturer && ` • ${item.manufacturer}`}
                              {item.modelNumber && ` • ${item.modelNumber}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.equipmentNumber ? (
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {item.equipmentNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {documentTypes[safeSelectedDocumentType]?.numberField ? (
                          item.documentNumber ? (
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {item.documentNumber}
                            </span>
                          ) : (
                            <span className="text-red-600 text-xs">No {documentTypes[safeSelectedDocumentType]?.numberLabel || 'Document'}</span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            {documentTypes[safeSelectedDocumentType]?.numberLabel || 'N/A'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.driverName ? (
                          <div>
                            <div className="font-medium">{item.driverName}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('equipment.istimara.file')}: {item.driverFileNumber || 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">{t('equipment.istimara.unassigned')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'expired'
                              ? 'destructive'
                              : item.status === 'expiring'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={`capitalize ${
                            item.status === 'expired'
                              ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                              : item.status === 'expiring'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
                                : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800'
                          }`}
                        >
                          {item.status === 'expired'
                            ? t('equipment.istimara.expired')
                            : item.status === 'expiring'
                              ? t('equipment.istimara.expiringSoon')
                              : item.status === 'missing'
                                ? t('equipment.istimara.missing')
                                : t('equipment.istimara.available')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.documentExpiry ? (
                          <div>
                            <div>{new Date(item.documentExpiry).toLocaleDateString()}</div>
                            {item.daysRemaining !== null && (
                              <div
                                className={`text-xs ${
                                  item.daysRemaining < 0
                                    ? 'text-red-600'
                                    : item.daysRemaining <= 30
                                      ? 'text-yellow-600'
                                      : 'text-muted-foreground'
                                }`}
                              >
                                {item.daysRemaining < 0
                                  ? t('equipment.istimara.daysOverdue', { days: Math.abs(item.daysRemaining) })
                                  : t('equipment.istimara.daysRemaining', { days: item.daysRemaining })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-600 font-medium">
                            {t('equipment.istimara.noExpiryDate')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateEquipment(item)}
                          className="h-8 w-8 p-0"
                          title={
                            item.status === 'missing'
                              ? `Add ${documentTypes[safeSelectedDocumentType]?.label || 'Document'} expiry date`
                              : `Update ${documentTypes[safeSelectedDocumentType]?.label || 'Document'} expiry date`
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('equipment.pagination.show')}
                </span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 text-sm border border-input rounded-md bg-background"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-muted-foreground">
                  {t('equipment.pagination.perPageText')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t('equipment.pagination.previous')}
                </Button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 7;
                    
                    if (totalPages <= maxVisiblePages) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className="h-8 w-8 p-0"
                          >
                            {i}
                          </Button>
                        );
                      }
                    } else {
                      // Show smart pagination for large numbers
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, currentPage + 2);
                      
                      // Always show first page
                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            className="h-8 w-8 p-0"
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="dots1" className="px-2 text-muted-foreground">...</span>
                          );
                        }
                      }
                      
                      // Show pages around current page
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className="h-8 w-8 p-0"
                          >
                            {i}
                          </Button>
                        );
                      }
                      
                      // Always show last page
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="dots2" className="px-2 text-muted-foreground">...</span>
                          );
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="h-8 w-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        );
                      }
                    }
                    
                    return pages;
                  })()}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t('equipment.pagination.next')}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {t('equipment.pagination.page', { current: currentPage, total: totalPages })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">{t('equipment.istimara.noRecordsFound')}</p>
            <p className="text-sm opacity-80">
              {search || statusFilter !== 'all'
                ? t('equipment.istimara.tryAdjustingSearchOrFilters')
                : t('equipment.istimara.allRecordsValid')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
