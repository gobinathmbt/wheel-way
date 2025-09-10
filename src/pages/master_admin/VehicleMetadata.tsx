import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, Plus, Search, Filter, FileText, Database, Car, Calendar, Settings, Trash2, Edit, RefreshCw } from 'lucide-react';
import { vehicleMetadataServices } from '@/api/services';
import FlexibleUploadModal from '@/components/metadata/FlexibleUploadModal';

interface FieldMapping {
  [key: string]: string;
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  currentItem: number;
  totalItems: number;
  message: string;
}

const VehicleMetadata = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [currentTab, setCurrentTab] = useState('metadata');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    body: '',
    year: '',
    fuelType: '',
    transmission: ''
  });
  
  // Upload states
  const [uploadStep, setUploadStep] = useState(0); // 0: select file, 1: configure mapping, 2: upload progress
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    currentItem: 0,
    totalItems: 0,
    message: ''
  });
  
  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFlexibleUpload, setShowFlexibleUpload] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState('make');
  const [editItem, setEditItem] = useState<any>(null);

  // Fetch queries
  const { data: makes, isLoading: makesLoading } = useQuery({
    queryKey: ['vehicle-metadata-makes'],
    queryFn: () => vehicleMetadataServices.getMakes()
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['vehicle-metadata-models', filters.make],
    queryFn: () => vehicleMetadataServices.getModelsByMake(filters.make),
    enabled: !!filters.make
  });

  const { data: bodies, isLoading: bodiesLoading } = useQuery({
    queryKey: ['vehicle-metadata-bodies'],
    queryFn: () => vehicleMetadataServices.getBodies()
  });

  const { data: years, isLoading: yearsLoading } = useQuery({
    queryKey: ['vehicle-metadata-years'],
    queryFn: () => vehicleMetadataServices.getVariantYears()
  });

  const { data: metadata, isLoading: metadataLoading } = useQuery({
    queryKey: ['vehicle-metadata', filters],
    queryFn: () => vehicleMetadataServices.getVehicleMetadata(filters)
  });

  const { data: dropdownData } = useQuery({
    queryKey: ['vehicle-metadata-dropdown'],
    queryFn: () => vehicleMetadataServices.getDropdownData('fuel-types')
  });

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: vehicleMetadataServices.uploadJsonMetadata,
    onSuccess: (response) => {
      toast.success(`Upload completed! Processed: ${response.data.processed}, Created: ${response.data.created}, Updated: ${response.data.updated}`);
      queryClient.invalidateQueries({ queryKey: ['vehicle-metadata'] });
      setShowUploadDialog(false);
      setUploadStep(0);
      setJsonData([]);
      setFieldMapping({});
    },
    onError: (error) => {
      toast.error('Upload failed');
      console.error('Upload error:', error);
    }
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => {
      switch (addDialogType) {
        case 'make':
          return vehicleMetadataServices.addMake(data);
        case 'model':
          return vehicleMetadataServices.addModel(data);
        case 'body':
          return vehicleMetadataServices.addBody(data);
        case 'year':
          return vehicleMetadataServices.addVariantYear(data);
        default:
          throw new Error('Invalid type');
      }
    },
    onSuccess: () => {
      toast.success(`${addDialogType} added successfully`);
      queryClient.invalidateQueries({ queryKey: ['vehicle-metadata'] });
      setShowAddDialog(false);
    },
    onError: () => {
      toast.error(`Failed to add ${addDialogType}`);
    }
  });

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) {
          toast.error('JSON must contain an array of objects');
          return;
        }
        setJsonData(data);
        setUploadStep(1);
      } catch (error) {
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleFieldMappingChange = (dbField: string, jsonField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [dbField]: jsonField
    }));
  };

  const handleUpload = async () => {
    if (!jsonData.length || !fieldMapping.make || !fieldMapping.model) {
      toast.error('Please map at least Make and Model fields');
      return;
    }

    setUploadStep(2);
    setUploadProgress({
      isUploading: true,
      progress: 0,
      currentItem: 0,
      totalItems: jsonData.length,
      message: 'Starting upload...'
    });

    try {
      await uploadMutation.mutateAsync({
        jsonData,
        fieldMapping
      });
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const resetUpload = () => {
    setUploadStep(0);
    setJsonData([]);
    setFieldMapping({});
    setUploadProgress({
      isUploading: false,
      progress: 0,
      currentItem: 0,
      totalItems: 0,
      message: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getJsonFields = () => {
    if (!jsonData.length) return [];
    return Object.keys(jsonData[0]);
  };

  const renderUploadStep = () => {
    switch (uploadStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Vehicle Metadata</h3>
              <p className="text-muted-foreground mb-4">
                Select a JSON file containing vehicle metadata to upload
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Select JSON File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Configure Field Mapping</h3>
              <Badge variant="secondary">{jsonData.length} records</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Database Field</Label>
              </div>
              <div>
                <Label>JSON Field</Label>
              </div>
              
              {/* Required fields */}
              <Label className="font-semibold text-red-600">Make *</Label>
              <Select value={fieldMapping.make || ''} onValueChange={(value) => handleFieldMappingChange('make', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field" />
                </SelectTrigger>
                <SelectContent>
                  {getJsonFields().map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label className="font-semibold text-red-600">Model *</Label>
              <Select value={fieldMapping.model || ''} onValueChange={(value) => handleFieldMappingChange('model', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field" />
                </SelectTrigger>
                <SelectContent>
                  {getJsonFields().map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Optional fields */}
              <Label>Body Type</Label>
              <Select value={fieldMapping.body || ''} onValueChange={(value) => handleFieldMappingChange('body', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Year</Label>
              <Select value={fieldMapping.year || ''} onValueChange={(value) => handleFieldMappingChange('year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Fuel Type</Label>
              <Select value={fieldMapping.fuelType || ''} onValueChange={(value) => handleFieldMappingChange('fuelType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Transmission</Label>
              <Select value={fieldMapping.transmission || ''} onValueChange={(value) => handleFieldMappingChange('transmission', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map(field => (
                    <SelectItem key={field} value={field}>{field}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetUpload}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={!fieldMapping.make || !fieldMapping.model}>
                Upload Data
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Uploading Data</h3>
              <p className="text-muted-foreground mb-4">{uploadProgress.message}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{uploadProgress.currentItem} / {uploadProgress.totalItems}</span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
            </div>

            {!uploadProgress.isUploading && (
              <div className="flex justify-center">
                <Button onClick={() => setShowUploadDialog(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderMetadataTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Make</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Body</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Fuel Type</TableHead>
          <TableHead>Transmission</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metadata?.data?.data?.map((item: any) => (
          <TableRow key={item._id}>
            <TableCell>{item.make?.displayName}</TableCell>
            <TableCell>{item.model?.displayName}</TableCell>
            <TableCell>{item.body?.displayName || '-'}</TableCell>
            <TableCell>{item.variantYear?.year || '-'}</TableCell>
            <TableCell>{item.fuelType || '-'}</TableCell>
            <TableCell>{item.transmission || '-'}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditItem(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderBasicTable = (data: any[], type: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Display Name</TableHead>
          <TableHead>Display Value</TableHead>
          {type === 'year' && <TableHead>Year</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((item: any) => (
          <TableRow key={item._id}>
            <TableCell>{item.displayName}</TableCell>
            <TableCell>{item.displayValue}</TableCell>
            {type === 'year' && <TableCell>{item.year}</TableCell>}
            <TableCell>
              <Badge variant={item.isActive ? 'default' : 'secondary'}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditItem(item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout title="Vehicle MetaData">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vehicle MetaData</h1>
            <p className="text-muted-foreground">
              Manage vehicle makes, models, body types, and metadata
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowFlexibleUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Simple JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Vehicle Metadata (Legacy)</DialogTitle>
                </DialogHeader>
                {renderUploadStep()}
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={addDialogType} onValueChange={setAddDialogType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="make">Make</SelectItem>
                        <SelectItem value="model">Model</SelectItem>
                        <SelectItem value="body">Body Type</SelectItem>
                        <SelectItem value="year">Variant Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Add form fields based on type */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button>Add</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label>Make</Label>
                <Select value={filters.make} onValueChange={(value) => setFilters(prev => ({ ...prev, make: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {makes?.data?.data?.map((make: any) => (
                      <SelectItem key={make._id} value={make._id}>
                        {make.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select value={filters.model} onValueChange={(value) => setFilters(prev => ({ ...prev, model: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {models?.data?.data?.map((model: any) => (
                      <SelectItem key={model._id} value={model._id}>
                        {model.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Body Type</Label>
                <Select value={filters.body} onValueChange={(value) => setFilters(prev => ({ ...prev, body: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Bodies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bodies</SelectItem>
                    {bodies?.data?.data?.map((body: any) => (
                      <SelectItem key={body._id} value={body._id}>
                        {body.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Select value={filters.year} onValueChange={(value) => setFilters(prev => ({ ...prev, year: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years?.data?.data?.map((year: any) => (
                      <SelectItem key={year._id} value={year._id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ make: '', model: '', body: '', year: '', fuelType: '', transmission: '' })}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <CardHeader>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="metadata" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Metadata
                  </TabsTrigger>
                  <TabsTrigger value="makes" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Makes
                  </TabsTrigger>
                  <TabsTrigger value="models" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Models
                  </TabsTrigger>
                  <TabsTrigger value="bodies" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Bodies
                  </TabsTrigger>
                  <TabsTrigger value="years" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Years
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <div className="p-6">
                <TabsContent value="metadata" className="mt-0">
                  {metadataLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderMetadataTable()
                  )}
                </TabsContent>

                <TabsContent value="makes" className="mt-0">
                  {makesLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(makes?.data?.data || [], 'make')
                  )}
                </TabsContent>

                <TabsContent value="models" className="mt-0">
                  {modelsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(models?.data?.data || [], 'model')
                  )}
                </TabsContent>

                <TabsContent value="bodies" className="mt-0">
                  {bodiesLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(bodies?.data?.data || [], 'body')
                  )}
                </TabsContent>

                <TabsContent value="years" className="mt-0">
                  {yearsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(years?.data?.data || [], 'year')
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Flexible Upload Modal */}
        <FlexibleUploadModal
          open={showFlexibleUpload}
          onClose={() => setShowFlexibleUpload(false)}
          onUploadComplete={(result) => {
            queryClient.invalidateQueries({ queryKey: ['vehicle-metadata'] });
            console.log('Upload completed:', result);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default VehicleMetadata;