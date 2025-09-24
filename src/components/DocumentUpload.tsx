import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface DocumentUploadProps {
  userId: string;
  bucket: string; // e.g., 'documents'
  folder: string; // e.g., `aadhaar` or `ration`
  label: string;
  accept?: string;
  currentUrl?: string | null;
  onUploaded?: (publicUrl: string) => void;
}

export function DocumentUpload({ userId, bucket, folder, label, accept = 'image/*,application/pdf', currentUrl, onUploaded }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = publicData.publicUrl;
      onUploaded?.(publicUrl);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  return (
    <Card className="bg-card/80">
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input type="file" accept={accept} onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={handleUpload} disabled={!file || isUploading} className="gradient-gold">
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          {currentUrl && (
            <a href={currentUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">View current</a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentUpload;


