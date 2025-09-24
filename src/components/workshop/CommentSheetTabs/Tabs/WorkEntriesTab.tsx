import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Wrench } from "lucide-react";
import { FormData } from "../../CommentSheetModal";
import WorkEntryCard from "../WorkEntryCard";

interface WorkEntriesTabProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isReadOnly: boolean;
  uploading: boolean;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
  expandedEntry: string | null;
  setExpandedEntry: React.Dispatch<React.SetStateAction<string | null>>;
  calculateEntryTotal: (entry: any) => number;
}

const WorkEntriesTab: React.FC<WorkEntriesTabProps> = ({
  formData,
  setFormData,
  isReadOnly,
  uploading,
  setUploading,
  expandedEntry,
  setExpandedEntry,
  calculateEntryTotal,
}) => {
  const addWorkEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      description: "",
      parts_cost: "",
      labor_cost: "",
      gst: "",
      parts_used: "",
      labor_hours: "",
      technician: formData.technician_assigned,
      completed: false,
      entry_date: new Date().toISOString().split('T')[0],
      entry_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      estimated_time: "",
      invoices: [],
      pdfs: [],
      videos: [],
      warranties: [],
      documents: [],
      images: [],
      persons: [],
      quality_check: {
        visual_inspection: false,
        functional_test: false,
        road_test: false,
        safety_check: false,
        notes: "",
      },
      comments: "",
    };
    setFormData(prev => ({
      ...prev,
      work_entries: [...prev.work_entries, newEntry]
    }));
    setExpandedEntry(newEntry.id);
  };

  const updateWorkEntry = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      work_entries: prev.work_entries.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const removeWorkEntry = (id: string) => {
    setFormData(prev => ({
      ...prev,
      work_entries: prev.work_entries.filter(entry => entry.id !== id)
    }));
  };

  const handleFileUpload = async (file: File, entryId: string, category: string, description = "") => {
    setUploading(true);
    try {
      const mockResult = {
        url: URL.createObjectURL(file),
        key: `${category}-${Date.now()}-${file.name}`,
        description: description || file.name,
      };

      const entry = formData.work_entries.find(e => e.id === entryId);
      if (entry) {
        const updatedCategory = [...(entry[category as keyof typeof entry] as any[]), mockResult];
        updateWorkEntry(entryId, category, updatedCategory);
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Work Entries</h2>
        {!isReadOnly && (
          <Button 
            type="button" 
            onClick={addWorkEntry} 
            className="bg-blue-600 hover:bg-blue-700 text-white h-9"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
        {formData.work_entries.map((entry, index) => (
          <WorkEntryCard
            key={entry.id}
            entry={entry}
            index={index}
            isReadOnly={isReadOnly}
            expandedEntry={expandedEntry}
            setExpandedEntry={setExpandedEntry}
            updateWorkEntry={updateWorkEntry}
            removeWorkEntry={removeWorkEntry}
            calculateEntryTotal={calculateEntryTotal}
            handleFileUpload={handleFileUpload}
            uploading={uploading}
          />
        ))}

        {formData.work_entries.length === 0 && (
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="text-center py-8">
              <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">No work entries added yet</p>
              {!isReadOnly && (
                <Button onClick={addWorkEntry} className="bg-blue-600 hover:bg-blue-700 h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Entry
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WorkEntriesTab;