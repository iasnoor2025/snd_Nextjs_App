'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertTriangle, XCircle, Wrench } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

export interface MaintenanceWorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  description: string;
  canSkip?: boolean;
}

interface MaintenanceWorkflowProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  onComplete: () => void;
  readonly?: boolean;
}

export function MaintenanceWorkflow({ 
  currentStatus, 
  onStatusChange, 
  onComplete, 
  readonly = false 
}: MaintenanceWorkflowProps) {
  const { t } = useI18n();

  const workflowSteps: MaintenanceWorkflowStep[] = [
    {
      id: 'scheduled',
      name: t('maintenance.workflow.scheduled'),
      status: currentStatus === 'scheduled' ? 'in_progress' : 
              ['open', 'in_progress', 'completed'].includes(currentStatus) ? 'completed' : 'pending',
      description: t('maintenance.workflow.scheduledDesc')
    },
    {
      id: 'in_progress',
      name: t('maintenance.workflow.inProgress'),
      status: currentStatus === 'in_progress' ? 'in_progress' : 
              currentStatus === 'completed' ? 'completed' : 'pending',
      description: t('maintenance.workflow.inProgressDesc')
    },
    {
      id: 'completed',
      name: t('maintenance.workflow.completed'),
      status: currentStatus === 'completed' ? 'completed' : 'pending',
      description: t('maintenance.workflow.completedDesc')
    }
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Wrench className="h-5 w-5 text-gray-400" />;
      case 'skipped':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Wrench className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-600';
      case 'skipped':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / workflowSteps.length) * 100;

  const handleStatusChange = (newStatus: string) => {
    if (!readonly) {
      onStatusChange(newStatus);
    }
  };

  const canComplete = currentStatus === 'in_progress' && !readonly;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('maintenance.workflow.title')}</span>
          <Badge className={getStatusBadgeColor(currentStatus)}>
            {t(`maintenance.status.${currentStatus}`)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{t('maintenance.workflow.progress')}</span>
            <span>{completedSteps}/{workflowSteps.length} {t('maintenance.workflow.completed')}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    {step.name}
                  </h4>
                  <Badge className={getStepBadgeColor(step.status)}>
                    {t(`maintenance.workflow.${step.status}`)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {step.description}
                </p>
                {step.status === 'pending' && !readonly && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(step.id)}
                    >
                      {t('maintenance.workflow.startStep')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Complete Maintenance Button */}
        {canComplete && (
          <div className="mt-6 pt-4 border-t">
            <Button
              type="button"
              onClick={onComplete}
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('maintenance.workflow.completeMaintenance')}
            </Button>
          </div>
        )}

        {/* Status Change Buttons */}
        {!readonly && currentStatus !== 'completed' && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex gap-2 flex-wrap">
              {currentStatus === 'open' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange('in_progress')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {t('maintenance.workflow.startWork')}
                </Button>
              )}
              {currentStatus === 'in_progress' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange('completed')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t('maintenance.workflow.markCompleted')}
                </Button>
              )}
              {currentStatus !== 'cancelled' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusChange('cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t('maintenance.workflow.cancel')}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
