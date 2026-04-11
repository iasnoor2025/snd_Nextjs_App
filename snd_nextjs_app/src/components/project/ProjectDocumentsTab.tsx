'use client';

import DocumentManager, { type DocumentItem } from '@/components/shared/DocumentManager';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/hooks/use-i18n';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { RefreshCw, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ProjectDocumentsTabProps {
  projectId: number;
}

const DOC_TYPE_VALUES = [
  'contract',
  'proposal',
  'report',
  'meeting_notes',
  'blueprint',
  'photo',
  'invoice',
  'specification',
  'general',
] as const;

export default function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const { t } = useI18n();
  const tRef = useRef(t);
  tRef.current = t;
  const { hasPermission } = useRBAC();
  const { data: session, status: sessionStatus } = useSession();
  const [uploading, setUploading] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  /** Bumped to tell DocumentManager to reload after upload/delete (list lives inside DocumentManager). */
  const [documentsVersion, setDocumentsVersion] = useState(0);

  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_type: '',
    file: null as File | null,
    description: '',
  });
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const documentTypeOptions = useMemo(
    () =>
      DOC_TYPE_VALUES.map(value => ({
        value,
        label: t(`project.documents.types.${value}`),
      })),
    [t]
  );

  const getDocumentTypeLabel = useCallback((type?: string) => {
    const tr = tRef.current;
    if (!type) return tr('project.documents.documentLabelDefault');
    const key = `project.documents.types.${type}`;
    const translated = tr(key);
    if (translated !== key) return translated;
    return type.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  }, []);

  const bumpDocuments = useCallback(() => {
    setDocumentsVersion(v => v + 1);
  }, []);

  const getFileTypeFromFileName = (fileName: string): string => {
    if (!fileName) return 'UNKNOWN';
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'UNKNOWN';
  };

  const loadDocumentsForManager = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];

        return list.map((d: Record<string, unknown>) => {
          const fileName = (d.fileName as string) || (d.file_name as string);
          const docType = (d.documentType as string) || (d.document_type as string);
          return {
            id: d.id as number,
            name:
              (d.fileName as string) ||
              (d.name as string) ||
              getDocumentTypeLabel(docType) ||
              tRef.current('project.documents.documentLabelDefault'),
            file_name: fileName || tRef.current('project.documents.unknownDocument'),
            file_type:
              (d.mimeType as string) ||
              (d.file_type as string) ||
              getFileTypeFromFileName(fileName || '') ||
              'UNKNOWN',
            size: (d.fileSize as number) || (d.size as number) || 0,
            url: (d.filePath as string) || (d.url as string) || '',
            created_at: (d.createdAt as string) || (d.created_at as string) || new Date().toISOString(),
            typeLabel: getDocumentTypeLabel(docType),
            document_type: docType || '',
            project_id: projectId,
          } as DocumentItem;
        }) as DocumentItem[];
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    } catch {
      return [] as DocumentItem[];
    }
  }, [projectId, getDocumentTypeLabel]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('project.documents.loadingSession')}</span>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated' || !session?.user) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">{t('project.documents.authRequiredTitle')}</div>
          <div className="mt-1 text-sm text-red-600">{t('project.documents.authRequiredDescription')}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <DocumentManager
          key={`${projectId}-${documentsVersion}`}
          title={t('project.documents.tabTitle')}
          description={t('project.documents.tabDescription')}
          beforeUpload={files => {
            if (!uploadForm.document_name.trim() || !uploadForm.document_type.trim()) {
              setPendingFiles(files);
              setShowDetailsDialog(true);
              return false;
            }
            return true;
          }}
          loadDocuments={loadDocumentsForManager}
          uploadDocument={async file => {
            try {
              setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

              const formData = new FormData();
              formData.append('file', file);
              formData.append('document_name', uploadForm.document_name.trim());
              if (uploadForm.document_type) formData.append('document_type', uploadForm.document_type);
              formData.append('description', uploadForm.description);

              const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                  const current = prev[file.name] || 0;
                  if (current < 90) {
                    return { ...prev, [file.name]: current + Math.random() * 10 };
                  }
                  return prev;
                });
              }, 200);

              const response = await fetch(`/api/projects/${projectId}/documents/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
              });

              clearInterval(progressInterval);

              if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error && errorData.error.includes('already exists')) {
                  toast.error(errorData.error);
                } else {
                  throw new Error(errorData.error || errorData.message || t('project.documents.uploadError'));
                }
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
                return false;
              }

              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
              return true;
            } catch (err) {
              setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
              toast.error(err instanceof Error ? err.message : t('project.documents.uploadError'));
              return false;
            }
          }}
          deleteDocument={async id => {
            try {
              const response = await fetch(`/api/projects/${projectId}/documents/${id}`, {
                method: 'DELETE',
                credentials: 'include',
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || t('project.documents.deleteError'));
              }
              return true;
            } catch (err) {
              toast.error(err instanceof Error ? err.message : t('project.documents.deleteError'));
              return false;
            }
          }}
          downloadDocument={async id => {
            try {
              const response = await fetch(`/api/projects/${projectId}/documents/${id}/download`, {
                method: 'GET',
                credentials: 'include',
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('project.documents.downloadError'));
              }

              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);

              const contentDisposition = response.headers.get('Content-Disposition');
              let filename = 'document.pdf';
              if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                  filename = filenameMatch[1].replace(/['"]/g, '');
                  try {
                    filename = decodeURIComponent(filename);
                  } catch {
                    /* keep raw */
                  }
                }
              }

              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);

              toast.success(t('project.documents.downloadSuccess'));
            } catch (err) {
              console.error('Download error:', err);
              toast.error(err instanceof Error ? err.message : t('project.documents.downloadError'));
            }
          }}
          canUpload={hasPermission('update', 'Project')}
          canDownload={hasPermission('read', 'Project')}
          canPreview={hasPermission('read', 'Project')}
          canDelete={hasPermission('delete', 'Project')}
          singleLine={false}
          wrapItems
          showSize={true}
          showDate={true}
          renderExtraControls={
            <div className="grid gap-3">
              <div>
                <Label htmlFor="description">{t('project.documents.descriptionLabel')}</Label>
                <Input
                  id="description"
                  value={uploadForm.description}
                  onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('project.documents.descriptionPlaceholder')}
                />
              </div>
            </div>
          }
        />
      </div>

      <Dialog
        open={showDetailsDialog}
        onOpenChange={open => {
          if (!open) setPendingFiles(null);
          setShowDetailsDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('project.documents.dialogTitleDetails')}</DialogTitle>
            <DialogDescription>{t('project.documents.dialogDescriptionUpload')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="doc_name_popup">{t('project.documents.documentName')}</Label>
              <Input
                id="doc_name_popup"
                value={uploadForm.document_name}
                onChange={e => setUploadForm(prev => ({ ...prev, document_name: e.target.value }))}
                placeholder={t('project.documents.documentNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="doc_type_popup">{t('project.documents.documentType')}</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={v => {
                  const opt = documentTypeOptions.find(o => o.value === v);
                  setUploadForm(prev => ({
                    ...prev,
                    document_type: v,
                    document_name: opt ? opt.label.replace(/^[^\s]+\s/, '') : v,
                  }));
                }}
              >
                <SelectTrigger id="doc_type_popup">
                  <SelectValue placeholder={t('project.documents.selectDocumentType')} />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pendingFiles && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <div className="mb-2">
                    <strong>{t('project.documents.filesToUpload')}</strong>{' '}
                    {t('project.documents.fileCount', { count: String(pendingFiles.length) })}
                  </div>
                  <div className="mb-2">
                    <strong>{t('project.documents.totalSize')}</strong>{' '}
                    {formatFileSize(pendingFiles.reduce((total, file) => total + file.size, 0))}
                  </div>
                </div>
                {uploading && Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <Label>{t('project.documents.uploadProgress')}</Label>
                    {pendingFiles.map(file => (
                      <div key={file.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{file.name}</span>
                          <span>{Math.round(uploadProgress[file.name] || 0)}%</span>
                        </div>
                        <Progress value={uploadProgress[file.name] || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailsDialog(false);
                setPendingFiles(null);
              }}
            >
              {t('project.buttons.cancel')}
            </Button>
            <Button
              onClick={async () => {
                if (!pendingFiles || pendingFiles.length === 0) {
                  toast.error(t('project.documents.noFilesSelected'));
                  return;
                }

                if (!uploadForm.document_name.trim() || !uploadForm.document_type) {
                  toast.error(t('project.documents.validationNameAndType'));
                  return;
                }

                setShowDetailsDialog(false);
                setUploading(true);

                try {
                  for (const file of pendingFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('document_name', uploadForm.document_name.trim());
                    if (uploadForm.document_type) formData.append('document_type', uploadForm.document_type);
                    formData.append('description', uploadForm.description);

                    const response = await fetch(`/api/projects/${projectId}/documents/upload`, {
                      method: 'POST',
                      body: formData,
                      credentials: 'include',
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(
                        errorData.error || t('project.documents.uploadFailedForFile', { name: file.name })
                      );
                    }
                  }

                  toast.success(
                    t('project.documents.multiUploadSuccess', { count: String(pendingFiles.length) })
                  );
                  setPendingFiles(null);
                  setUploadForm({ document_name: '', document_type: '', file: null, description: '' });
                  bumpDocuments();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : t('project.documents.uploadError'));
                } finally {
                  setUploading(false);
                }
              }}
              disabled={!uploadForm.document_name.trim() || !uploadForm.document_type || uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t('project.documents.uploading')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('project.documents.uploadButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
