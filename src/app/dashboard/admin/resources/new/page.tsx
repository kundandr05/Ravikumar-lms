'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function NewResourcePage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'resources'), {
        title,
        description,
        category,
        subject,
        fileUrl,
        createdAt: serverTimestamp(),
      });

      alert("Study material uploaded successfully!");
      router.push('/dashboard/admin/resources');
    } catch (error) {
      console.error("Error creating resource", error);
      alert("Failed to create resource.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/admin/resources')}>Back</Button>
        <h1 className="text-3xl font-bold">Upload Study Material</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
          <CardDescription>Provide metadata and a link to the PDF or Document.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Chapter 1 Notes" 
                  required 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject / Course</Label>
                <Input 
                  id="subject" 
                  placeholder="e.g. Mathematics" 
                  required 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as string)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF Notes">PDF Notes</SelectItem>
                  <SelectItem value="Worksheet">Worksheet</SelectItem>
                  <SelectItem value="Question Bank">Question Bank</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Briefly describe the contents of this material..." 
                required 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL (Google Drive, Dropbox, direct PDF link)</Label>
              <Input 
                id="fileUrl" 
                type="url"
                placeholder="https://..." 
                required 
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
              <p className="text-xs text-slate-500">Ensure the link permissions are set so anyone can view or download the file.</p>
            </div>

            <Button type="submit" className="w-full mt-6 bg-slate-900 hover:bg-slate-800" disabled={loading}>
              {loading ? 'Uploading...' : 'Save Resource'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
