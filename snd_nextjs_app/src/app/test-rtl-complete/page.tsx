'use client';

import { useI18n } from '@/hooks/use-i18n';
import { RTLPageLayout, RTLHeader, RTLContent, RTLFlex } from '@/components/rtl-page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Download, Upload, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export default function TestRTLCompletePage() {
  const { currentLanguage, isRTL, changeLanguage, languages } = useI18n();

  const testData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', department: 'IT' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', department: 'HR' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active', department: 'Finance' },
  ];

  return (
    <RTLPageLayout>
      <RTLHeader>
        <RTLContent>
          <h1 className="text-3xl font-bold">RTL Complete Test</h1>
          <p className="text-muted-foreground">Testing all RTL functionality</p>
        </RTLContent>

        <RTLFlex gap="gap-2">
          <Button variant="outline">
            <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            Export
          </Button>
          <Button>
            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            Add Item
          </Button>
        </RTLFlex>
      </RTLHeader>

      <Card>
        <CardHeader>
          <CardTitle>Test Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`} />
                <Input
                  placeholder="Search..."
                  className={isRTL ? 'pr-10' : 'pl-10'}
                />
              </div>
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      Name
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      Email
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      Department
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className={isRTL ? 'text-right' : 'text-left'}>
                    <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      Status
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className={isRTL ? 'text-left' : 'text-right'}>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                      {item.name}
                    </TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                      {item.email}
                    </TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                      {item.department}
                    </TableCell>
                    <TableCell className={isRTL ? 'text-right' : 'text-left'}>
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                      <div className={`flex items-center gap-2 ${isRTL ? 'justify-start' : 'justify-end'}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className={`flex items-center justify-between mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`text-sm text-muted-foreground ${isRTL ? 'text-right' : 'text-left'}`}>
                Showing 1-3 of 3 items
              </div>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button variant="outline" size="sm">
                {isRTL ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                {isRTL ? (
                  <>
                    Previous
                    <ChevronLeft className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 mr-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current RTL State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Language:</strong> {currentLanguage}</p>
            <p><strong>Is RTL:</strong> {isRTL ? 'Yes' : 'No'}</p>
            <p><strong>Sidebar Position:</strong> {isRTL ? 'Right' : 'Left'}</p>
            <p><strong>Text Direction:</strong> {isRTL ? 'Right-to-Left' : 'Left-to-Right'}</p>
          </div>
          
          <div className="mt-4">
            <p className="font-semibold mb-2">Quick Language Switch:</p>
            <RTLFlex gap="gap-2">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  variant={currentLanguage === lang.code ? 'default' : 'outline'}
                >
                  {lang.flag} {lang.name}
                </Button>
              ))}
            </RTLFlex>
          </div>
        </CardContent>
      </Card>
    </RTLPageLayout>
  );
} 