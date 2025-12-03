'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  HardDrive,
  FileText,
  Archive
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

interface Backup {
  id: string;
  timestamp: string;
  type: 'full' | 'schema' | 'data';
  createdBy: string;
  status: 'completed' | 'failed' | 'in_progress';
  downloadUrl: string;
  fileSize?: number;
}

interface BackupManagerProps {
  className?: string;
}

export function DatabaseBackupManager({ className }: BackupManagerProps) {
  const { t } = useI18n();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  
  // Create backup form state
  const [backupType, setBackupType] = useState<'full' | 'schema' | 'data'>('full');
  const [includeMedia, setIncludeMedia] = useState(false);
  const [compression, setCompression] = useState(true);
  
  // Restore form state
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [createBackupBeforeRestore, setCreateBackupBeforeRestore] = useState(true);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/backup');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        toast.error('Failed to load backups');
      }
    } catch (error) {
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: backupType,
          includeMedia,
          compression,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Backup created successfully');
        setShowCreateDialog(false);
        loadBackups();
      } else {
        toast.error(data.message || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      const response = await fetch(backup.downloadUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${backup.id}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Backup downloaded successfully');
      } else {
        toast.error('Failed to download backup');
      }
    } catch (error) {
      toast.error('Failed to download backup');
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup || !confirmRestore) return;
    
    setRestoringBackup(selectedBackup.id);
    try {
      const response = await fetch(`/api/admin/backup/${selectedBackup.id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmRestore: true,
          createBackupBeforeRestore,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Database restored successfully');
        setShowRestoreDialog(false);
        setSelectedBackup(null);
        setConfirmRestore(false);
      } else {
        if (response.status === 403) {
          toast.error(`Access denied: ${data.error}. Your role: ${data.userRole}, Required: ${data.requiredRole}`);
        } else if (response.status === 401) {
          toast.error('Authentication required. Please log in again.');
        } else {
          toast.error(data.message || 'Failed to restore backup');
        }
      }
    } catch (error) {
      toast.error('Failed to restore backup');
    } finally {
      setRestoringBackup(null);
    }
  };

  const deleteBackup = async () => {
    if (!selectedBackup) return;
    
    setDeletingBackup(selectedBackup.id);
    try {
      const response = await fetch(`/api/admin/backup/${selectedBackup.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Backup deleted successfully');
        setShowDeleteDialog(false);
        setSelectedBackup(null);
        loadBackups();
      } else {
        toast.error(data.message || 'Failed to delete backup');
      }
    } catch (error) {
      toast.error('Failed to delete backup');
    } finally {
      setDeletingBackup(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return <Database className="h-4 w-4" />;
      case 'schema': return <FileText className="h-4 w-4" />;
      case 'data': return <Archive className="h-4 w-4" />;
      default: return <HardDrive className="h-4 w-4" />;
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-green-100 text-green-800';
      case 'schema': return 'bg-blue-100 text-blue-800';
      case 'data': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Backup Manager
          </CardTitle>
          <CardDescription>
            Create, manage, and restore database backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Backup Section */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Create New Backup</h3>
              <p className="text-sm text-muted-foreground">
                Create a backup of your database
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Database Backup</DialogTitle>
                  <DialogDescription>
                    Choose the type of backup you want to create
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Backup Type</label>
                    <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Backup (Schema + Data)</SelectItem>
                        <SelectItem value="schema">Schema Only</SelectItem>
                        <SelectItem value="data">Data Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="includeMedia" 
                      checked={includeMedia} 
                      onCheckedChange={(checked) => setIncludeMedia(checked as boolean)}
                    />
                    <label htmlFor="includeMedia" className="text-sm">
                      Include media files
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="compression" 
                      checked={compression} 
                      onCheckedChange={(checked) => setCompression(checked as boolean)}
                    />
                    <label htmlFor="compression" className="text-sm">
                      Enable compression
                    </label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createBackup} disabled={creatingBackup}>
                    {creatingBackup ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        Create Backup
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Backups List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Backups</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Clock className="h-6 w-6 animate-spin mr-2" />
                Loading backups...
              </div>
            ) : backups.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No backups found. Create your first backup to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <Card key={backup.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getBackupTypeIcon(backup.type)}
                          <div>
                            <div className="font-medium">{backup.id}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(backup.timestamp)} • {backup.createdBy}
                            </div>
                          </div>
                          <Badge className={getBackupTypeColor(backup.type)}>
                            {backup.type.toUpperCase()}
                          </Badge>
                          {backup.fileSize && (
                            <Badge variant="outline">
                              {formatFileSize(backup.fileSize)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(backup)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setShowRestoreDialog(true);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database</DialogTitle>
            <DialogDescription>
              This will replace your current database with the selected backup. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This will completely replace your current database. 
                Make sure you have a recent backup before proceeding.
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="createBackupBeforeRestore" 
                checked={createBackupBeforeRestore} 
                onCheckedChange={(checked) => setCreateBackupBeforeRestore(checked as boolean)}
              />
              <label htmlFor="createBackupBeforeRestore" className="text-sm">
                Create backup before restoring (recommended)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="confirmRestore" 
                checked={confirmRestore} 
                onCheckedChange={(checked) => setConfirmRestore(checked as boolean)}
              />
              <label htmlFor="confirmRestore" className="text-sm font-medium">
                I understand this will replace my current database
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={restoreBackup} 
              disabled={!confirmRestore || restoringBackup === selectedBackup?.id}
            >
              {restoringBackup === selectedBackup?.id ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Backup</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this backup? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Backup: <strong>{selectedBackup?.id}</strong><br />
                Created: {selectedBackup && formatDate(selectedBackup.timestamp)}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteBackup} 
              disabled={deletingBackup === selectedBackup?.id}
            >
              {deletingBackup === selectedBackup?.id ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
