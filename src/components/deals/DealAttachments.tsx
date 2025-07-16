import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, Download, Trash2, FileText, Image, File, XCircle } from "lucide-react";
import { useCRMData } from "@/hooks/useCRMData";
import { format, formatDistanceToNowStrict } from "date-fns";
import type { Deal, DealAttachment } from "@/types/crm";

interface DealAttachmentsProps {
  deal: Deal;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-muted-foreground" />;
  if (mimeType.startsWith("text/")) return <FileText className="w-5 h-5 text-muted-foreground" />;
  if (mimeType.startsWith("application/pdf")) return <FileText className="w-5 h-5 text-red-500" />;
  // Add more specific icons if needed
  return <File className="w-5 h-5 text-muted-foreground" />;
};

export function DealAttachments({ deal }: DealAttachmentsProps) {
  const { uploadDealAttachment, deleteDealAttachment, getFullName } = useCRMData();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadDealAttachment(deal.id, files[i]);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the input
      }
    }
  };

  const handleDeleteAttachment = async (attachment: DealAttachment) => {
    if (confirm(`Are you sure you want to delete "${attachment.file_name}"?`)) {
      await deleteDealAttachment(attachment.id, attachment.deal_id, attachment.file_path);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          Attachments ({deal.attachments?.length || 0})
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Add File"}
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deal.attachments && deal.attachments.length > 0 ? (
          <div className="space-y-3">
            {deal.attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-2 border border-border/50 rounded-md bg-muted/10">
                <div className="flex items-center space-x-3 min-w-0">
                  {getFileIcon(attachment.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.file_size / 1024).toFixed(1)} KB • Uploaded by {attachment.uploader ? getFullName(attachment.uploader) : "Unknown"} {formatDistanceToNowStrict(new Date(attachment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {attachment.download_url && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={attachment.download_url} target="_blank" rel="noopener noreferrer" title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAttachment(attachment)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            No files attached yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}