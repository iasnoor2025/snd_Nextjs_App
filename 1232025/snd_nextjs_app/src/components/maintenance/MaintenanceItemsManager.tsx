'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

export interface MaintenanceItem {
  id?: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitCost: number;
  totalCost: number;
}

interface MaintenanceItemsManagerProps {
  items: MaintenanceItem[];
  onItemsChange: (items: MaintenanceItem[]) => void;
  readonly?: boolean;
}

export function MaintenanceItemsManager({ 
  items, 
  onItemsChange, 
  readonly = false 
}: MaintenanceItemsManagerProps) {
  const { t } = useI18n();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<MaintenanceItem>({
    name: '',
    description: '',
    quantity: 1,
    unit: '',
    unitCost: 0,
    totalCost: 0
  });

  const calculateTotalCost = (quantity: number, unitCost: number) => {
    return quantity * unitCost;
  };

  const handleAddItem = () => {
    if (!newItem.name || newItem.unitCost <= 0) return;
    
    const totalCost = calculateTotalCost(newItem.quantity, newItem.unitCost);
    const itemToAdd = { ...newItem, totalCost };
    
    onItemsChange([...items, itemToAdd]);
    setNewItem({
      name: '',
      description: '',
      quantity: 1,
      unit: '',
      unitCost: 0,
      totalCost: 0
    });
    setIsAddingItem(false);
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setNewItem(items[index]);
    setIsAddingItem(true);
  };

  const handleUpdateItem = () => {
    if (!newItem.name || newItem.unitCost <= 0 || editingIndex === null) return;
    
    const totalCost = calculateTotalCost(newItem.quantity, newItem.unitCost);
    const updatedItems = [...items];
    updatedItems[editingIndex] = { ...newItem, totalCost };
    
    onItemsChange(updatedItems);
    setNewItem({
      name: '',
      description: '',
      quantity: 1,
      unit: '',
      unitCost: 0,
      totalCost: 0
    });
    setIsAddingItem(false);
    setEditingIndex(null);
  };

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const handleCancel = () => {
    setIsAddingItem(false);
    setEditingIndex(null);
    setNewItem({
      name: '',
      description: '',
      quantity: 1,
      unit: '',
      unitCost: 0,
      totalCost: 0
    });
  };

  const totalItemsCost = items.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('maintenance.items.title')}</span>
          {!readonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingItem(true)}
              disabled={isAddingItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('maintenance.items.addItem')}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add/Edit Item Form */}
        {isAddingItem && !readonly && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="item-name">{t('maintenance.items.name')} *</Label>
                <Input
                  id="item-name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder={t('maintenance.items.namePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="item-quantity">{t('maintenance.items.quantity')} *</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => {
                    const quantity = parseFloat(e.target.value) || 1;
                    setNewItem({ 
                      ...newItem, 
                      quantity,
                      totalCost: calculateTotalCost(quantity, newItem.unitCost)
                    });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="item-unit">{t('maintenance.items.unit')}</Label>
                <Input
                  id="item-unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder={t('maintenance.items.unitPlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="item-unit-cost">{t('maintenance.items.unitCost')} *</Label>
                <Input
                  id="item-unit-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.unitCost}
                  onChange={(e) => {
                    const unitCost = parseFloat(e.target.value) || 0;
                    setNewItem({ 
                      ...newItem, 
                      unitCost,
                      totalCost: calculateTotalCost(newItem.quantity, unitCost)
                    });
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="item-description">{t('maintenance.items.description')}</Label>
              <Textarea
                id="item-description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder={t('maintenance.items.descriptionPlaceholder')}
                rows={2}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                onClick={editingIndex !== null ? handleUpdateItem : handleAddItem}
                disabled={!newItem.name || newItem.unitCost <= 0}
              >
                {editingIndex !== null ? t('maintenance.actions.update') : t('maintenance.items.addItem')}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t('common.actions.cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Items Table */}
        {items.length > 0 ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('maintenance.items.name')}</TableHead>
                  <TableHead>{t('maintenance.items.quantity')}</TableHead>
                  <TableHead>{t('maintenance.items.unit')}</TableHead>
                  <TableHead>{t('maintenance.items.unitCost')}</TableHead>
                  <TableHead>{t('maintenance.items.totalCost')}</TableHead>
                  <TableHead>{t('maintenance.items.description')}</TableHead>
                  {!readonly && <TableHead>{t('common.actions.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit || '-'}</TableCell>
                    <TableCell>SAR {item.unitCost.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">SAR {item.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.description || '-'}</TableCell>
                    {!readonly && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditItem(index)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Total Cost Summary */}
            <div className="flex justify-end">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-semibold">
                  {t('maintenance.items.totalCost')}: SAR {totalItemsCost.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t('maintenance.items.noItems')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
