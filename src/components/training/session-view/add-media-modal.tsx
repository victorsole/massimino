// src/components/training/session-view/add-media-modal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Link as LinkIcon, Instagram, Video } from 'lucide-react';

type AddMediaModalProps = {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  onMediaAdded: () => void;
};

export function AddMediaModal({
  open,
  onClose,
  exerciseId,
  onMediaAdded,
}: AddMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('link');
  const [provider, setProvider] = useState<'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE'>('INSTAGRAM');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('exerciseId', exerciseId);
      formData.append('title', mediaTitle || selectedFile.name);

      const response = await fetch(`/api/workout/exercises/${exerciseId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        onMediaAdded();
        handleClose();
      } else {
        console.error('Failed to upload media');
        alert('Failed to upload media. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Error uploading media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLinkMedia = async () => {
    if (!mediaUrl.trim()) {
      alert('Please enter a valid URL');
      return;
    }

    try {
      setUploading(true);

      const response = await fetch(`/api/workout/exercises/${exerciseId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          url: mediaUrl,
          title: mediaTitle || `${provider} video`,
        }),
      });

      if (response.ok) {
        onMediaAdded();
        handleClose();
      } else {
        console.error('Failed to link media');
        alert('Failed to link media. Please try again.');
      }
    } catch (error) {
      console.error('Error linking media:', error);
      alert('Error linking media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setMediaUrl('');
    setMediaTitle('');
    setSelectedFile(null);
    setProvider('INSTAGRAM');
    setActiveTab('link');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Exercise Media</DialogTitle>
          <DialogDescription>
            Upload a video/image or link to your social media content
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="flex items-center space-x-2">
              <LinkIcon className="h-4 w-4" />
              <span>Link Social Media</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </TabsTrigger>
          </TabsList>

          {/* Link Social Media Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Social Platform</Label>
                <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSTAGRAM">
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4" />
                        <span>Instagram</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="TIKTOK">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>TikTok</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="YOUTUBE">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4" />
                        <span>YouTube</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Video URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="Paste your video URL here..."
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Example: https://www.instagram.com/p/...
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Proper form demonstration"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleLinkMedia} disabled={uploading || !mediaUrl.trim()}>
                {uploading ? 'Adding...' : 'Add Link'}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Upload File Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    id="file"
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {selectedFile ? (
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Click to select a file</p>
                        <p className="text-sm text-muted-foreground">or drag and drop</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Supports: MP4, MOV, JPG, PNG, GIF
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-title">Title (optional)</Label>
                <Input
                  id="upload-title"
                  type="text"
                  placeholder="e.g., Form demonstration"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
