import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Define field types for the list editor
export interface Field {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  validator?: (value: any) => boolean | string;
}

// Props interface for the ListEditor component
export interface ListEditorProps {
  title: string;
  description?: string;
  fields: Field[];
  items: any[];
  onAddItem: (item: any) => Promise<void>;
  onEditItem: (item: any, index: number) => Promise<void>;
  onDeleteItem: (item: any, index: number) => Promise<void>;
  onMoveItem?: (index: number, direction: 'up' | 'down') => Promise<void>;
  keyField?: string;
  renderBadge?: (item: any) => React.ReactNode;
  itemToString?: (item: any) => string;
  enableOrdering?: boolean;
  enableSearch?: boolean;
  confirmDelete?: boolean;
  maxHeight?: string;
}

export function ListEditor({
  title,
  description,
  fields,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onMoveItem,
  keyField = 'id',
  renderBadge,
  itemToString,
  enableOrdering = false,
  enableSearch = true,
  confirmDelete = true,
  maxHeight
}: ListEditorProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>(items);
  const [isLoading, setIsLoading] = useState(false);
  
  // Update form data when fields change
  useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      initialData[field.id] = field.defaultValue !== undefined ? field.defaultValue : 
        field.type === 'boolean' ? false : 
        field.type === 'number' ? 0 : '';
    });
    setFormData(initialData);
  }, [fields]);
  
  // Filter items when search query changes
  useEffect(() => {
    if (!enableSearch || !searchQuery) {
      setFilteredItems(items);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = items.filter(item => {
      if (itemToString) {
        return itemToString(item).toLowerCase().includes(lowerQuery);
      }
      
      // Search through each field in the item
      return Object.entries(item).some(([key, value]) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        if (typeof value === 'number') {
          return value.toString().includes(lowerQuery);
        }
        return false;
      });
    });
    
    setFilteredItems(filtered);
  }, [searchQuery, items, enableSearch, itemToString]);
  
  // Reset form 
  const resetForm = () => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      initialData[field.id] = field.defaultValue !== undefined ? field.defaultValue : 
        field.type === 'boolean' ? false : 
        field.type === 'number' ? 0 : '';
    });
    setFormData(initialData);
    setFormErrors({});
  };
  
  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setMode('add');
    setDialogOpen(true);
  };
  
  // Open edit dialog
  const openEditDialog = (item: any, index: number) => {
    // Create a copy of the item for the form
    const editData: Record<string, any> = {};
    fields.forEach(field => {
      editData[field.id] = item[field.id] !== undefined ? item[field.id] : 
        field.defaultValue !== undefined ? field.defaultValue : 
        field.type === 'boolean' ? false : 
        field.type === 'number' ? 0 : '';
    });
    
    setFormData(editData);
    setMode('edit');
    setCurrentIndex(index);
    setDialogOpen(true);
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (index: number) => {
    setCurrentIndex(index);
    if (confirmDelete) {
      setConfirmDeleteOpen(true);
    } else {
      handleDelete();
    }
  };
  
  // Handle form field change
  const handleFieldChange = (id: string, value: any) => {
    setFormData({ ...formData, [id]: value });
    
    // If there was an error for this field, remove it when the user makes changes
    if (formErrors[id]) {
      const updatedErrors = { ...formErrors };
      delete updatedErrors[id];
      setFormErrors(updatedErrors);
    }
  };
  
  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = formData[field.id];
      
      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors[field.id] = `${field.label} is required`;
      }
      
      // Run custom validator if provided
      if (field.validator && value !== undefined && value !== null && value !== '') {
        const validationResult = field.validator(value);
        if (typeof validationResult === 'string') {
          errors[field.id] = validationResult;
        } else if (validationResult === false) {
          errors[field.id] = `Invalid ${field.label}`;
        }
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle save (add or edit)
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (mode === 'add') {
        await onAddItem(formData);
        toast({
          title: "Success",
          description: "Item added successfully"
        });
      } else if (mode === 'edit' && currentIndex !== null) {
        await onEditItem(formData, currentIndex);
        toast({
          title: "Success",
          description: "Item updated successfully"
        });
      }
      
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (currentIndex === null) return;
    
    setIsLoading(true);
    
    try {
      await onDeleteItem(items[currentIndex], currentIndex);
      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
      setConfirmDeleteOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle move item
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!onMoveItem) return;
    
    setIsLoading(true);
    
    try {
      await onMoveItem(index, direction);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render table with items
  const renderTable = () => {
    return (
      <div className={`rounded-md border ${maxHeight ? `overflow-auto max-h-[${maxHeight}]` : ''}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((field, index) => (
                <TableHead key={field.id}>
                  {field.label}
                </TableHead>
              ))}
              {renderBadge && <TableHead>Status</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <TableRow key={item[keyField] || index}>
                  {fields.map((field) => (
                    <TableCell key={field.id}>
                      {renderCellContent(item, field)}
                    </TableCell>
                  ))}
                  {renderBadge && (
                    <TableCell>
                      {renderBadge(item)}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      {enableOrdering && onMoveItem && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveItem(index, 'up')}
                            disabled={index === 0 || isLoading}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveItem(index, 'down')}
                            disabled={index === items.length - 1 || isLoading}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item, index)}
                        disabled={isLoading}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={fields.length + (renderBadge ? 2 : 1)} className="h-24 text-center">
                  No items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Render cell content based on field type
  const renderCellContent = (item: any, field: Field) => {
    const value = item[field.id];
    
    if (value === undefined || value === null) {
      return <span className="text-gray-400">—</span>;
    }
    
    switch (field.type) {
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'select':
        if (field.options) {
          const option = field.options.find(opt => opt.value === value);
          return option ? option.label : value;
        }
        return value;
      case 'textarea':
        return value.length > 50 ? `${value.substring(0, 50)}...` : value;
      default:
        return value;
    }
  };
  
  // Render form fields
  const renderFormFields = () => {
    return fields.map((field) => (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {field.type === 'text' && (
          <Input
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={formErrors[field.id] ? 'border-red-500' : ''}
          />
        )}
        
        {field.type === 'textarea' && (
          <Textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={formErrors[field.id] ? 'border-red-500' : ''}
          />
        )}
        
        {field.type === 'number' && (
          <Input
            id={field.id}
            type="number"
            value={formData[field.id] || 0}
            onChange={(e) => handleFieldChange(field.id, e.target.valueAsNumber)}
            className={formErrors[field.id] ? 'border-red-500' : ''}
          />
        )}
        
        {field.type === 'boolean' && (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.id}
              checked={!!formData[field.id]}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id}>
              {!!formData[field.id] ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        )}
        
        {field.type === 'select' && field.options && (
          <Select
            value={formData[field.id] || ''}
            onValueChange={(value) => handleFieldChange(field.id, value)}
          >
            <SelectTrigger id={field.id} className={formErrors[field.id] ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {formErrors[field.id] && (
          <p className="text-red-500 text-sm">{formErrors[field.id]}</p>
        )}
      </div>
    ));
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button onClick={openAddDialog} disabled={isLoading}>
          <Plus className="mr-1 h-4 w-4" />
          Add New
        </Button>
      </div>
      
      {enableSearch && (
        <div className="mb-4">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      
      {renderTable()}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'add' ? 'Add New Item' : 'Edit Item'}</DialogTitle>
            <DialogDescription>
              {mode === 'add' 
                ? 'Fill in the details below to add a new item.'
                : 'Update the item details below.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {renderFormFields()}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
            >
              <X className="mr-1 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="mr-1 h-4 w-4" />
              {mode === 'add' ? 'Add' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}