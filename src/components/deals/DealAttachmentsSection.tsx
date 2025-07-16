import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Receipt, Link, Trash2, Download } from "lucide-react";
import { useCRMData } from "@/hooks/useCRMData";
import type { Deal, DealAttachment } from "@/types/crm";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface DealAttachmentsSectionProps {
  deal: Deal;
}

export function DealAttachmentsSection({ deal }: DealAttachmentsSectionProps) {
  const { uploadDealAttachment, deleteDealAttachment, getFullName } = useCRMData(); // Destructure all needed properties
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<DealAttachment['attachment_type']>('other');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!deal.id || !selectedFile) return;

    setIsUploading(true);
    try {
      await uploadDealAttachment(deal.id, selectedFile, attachmentType);
      setSelectedFile(null);
      setAttachmentType('other');
      // The useCRMData hook will automatically update the 'deals' state,
      // which will re-render this component with the new attachment.
    } catch (error) {
      console.error("Failed to upload attachment:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string, filePath: string) => {
    if (confirm("Are you sure you want to delete this attachment?")) {
      try {
        await deleteDealAttachment(attachmentId, deal.id, filePath);
      } catch (error) {
        console.error("Failed to delete attachment:", error);
      }
    }
  };

  const getAttachmentIcon = (type: DealAttachment['attachment_type']) => {
    switch (type) {
      case 'contract': return <FileText className="w-5 h-5 text-primary" />;
      case 'receipt': return <Receipt className="w-5 h-5 text-success" />;
      case 'other': return <Link className="w-5 h-5 text-muted-foreground" />;
      default: return <Link className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Deal Attachments ({deal.attachments?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deal.attachments && deal.attachments.length > 0 ? (
          <div className="space-y-3">
            {deal.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 border border-border/50 rounded-md bg-background/50">
                <div className="flex items-center space-x-3">
                  {getAttachmentIcon(attachment.attachment_type)}
                  <div>
                    <a 
                      href={attachment.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-primary hover:underline text-sm"
                    >
                      {attachment.file_name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {attachment.attachment_type.charAt(0).toUpperCase() + attachment.attachment_type.slice(1)} uploaded by {attachment.uploader ? getFullName(attachment.uploader) : "Unknown"} on {format(new Date(attachment.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Plus className="h-4 w-4 rotate-45" /> {/* Using Plus icon rotated for more options */}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(attachment.id, attachment.file_url)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">No attachments yet. Upload important documents here!</p>
        )}

        <Separator />

        <div className="space-y-3 pt-4">
          <h3 className="font-semibold text-base">Upload New Attachment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">File</Label>
              <Input id="file-upload" type="file" onChange={handleFileChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment-type">Type</Label>
              <Select value={attachmentType} onValueChange={(value: DealAttachment['attachment_type']) => setAttachmentType(value)}>
                <SelectTrigger id="attachment-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading} 
            className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth"
          >
            {isUploading ? "Uploading..." : <><Plus className="w-4 h-4 mr-2" /> Upload Attachment</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}