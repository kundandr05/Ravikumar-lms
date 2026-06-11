'use client';

import { useState, useEffect, useRef, use } from 'react';
import { db, storage } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaContent, MediaType } from '@/types';
import Link from 'next/link';

export default function CourseMediaManager({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [mediaList, setMediaList] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<MediaType>('document');
  
  const [chapterFilter, setChapterFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [uploadChapter, setUploadChapter] = useState('Chapter 1');

  // Edit Modal State
  const [editingMedia, setEditingMedia] = useState<MediaContent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editChapter, setEditChapter] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [courseId]);

  const fetchMedia = async () => {
    try {
      const q = query(
        collection(db, 'media'), 
        where('courseId', '==', courseId)
      );
      const snapshot = await getDocs(q);
      const mediaData: MediaContent[] = [];
      snapshot.forEach(doc => {
        mediaData.push({ id: doc.id, ...doc.data() } as MediaContent);
      });
      
      mediaData.sort((a, b) => a.order - b.order);
      setMediaList(mediaData);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaTitle || !newMediaUrl) return;
    
    setAdding(true);
    
    try {
      const newMedia: Omit<MediaContent, 'id'> = {
        courseId: courseId,
        chapter: uploadChapter || 'Uncategorized',
        title: newMediaTitle,
        type: newMediaType,
        url: newMediaUrl,
        fileExtension: 'link',
        sizeBytes: 0,
        order: mediaList.length,
        createdAt: Timestamp.now(),
      };
      
      await addDoc(collection(db, 'media'), newMedia);
      setNewMediaTitle('');
      setNewMediaUrl('');
      fetchMedia();
    } catch (error: any) {
      console.error("Failed to add media link:", error);
      alert(`Failed to add media. Error: ${error.message || 'Unknown error'}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (media: MediaContent) => {
    if (!confirm(`Are you sure you want to delete "${media.title}"?`)) return;
    
    try {
      if (media.id) {
        await deleteDoc(doc(db, 'media', media.id));
      }
      setMediaList(prev => prev.filter(m => m.id !== media.id));
    } catch (error) {
      console.error("Error deleting media:", error);
      alert("Failed to delete media.");
    }
  };

  const handleEditClick = (media: MediaContent) => {
    setEditingMedia(media);
    setEditTitle(media.title);
    setEditChapter(media.chapter);
  };

  const handleSaveEdit = async () => {
    if (!editingMedia?.id) return;
    setSavingEdit(true);
    try {
      const mediaRef = doc(db, 'media', editingMedia.id);
      await updateDoc(mediaRef, {
        title: editTitle,
        chapter: editChapter
      });
      setMediaList(prev => prev.map(m => m.id === editingMedia.id ? { ...m, title: editTitle, chapter: editChapter } : m));
      setEditingMedia(null);
    } catch (error) {
      console.error("Error saving media edit:", error);
      alert("Failed to save changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Group media by chapter
  const filteredMedia = mediaList.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChapter = chapterFilter ? m.chapter === chapterFilter : true;
    return matchesSearch && matchesChapter;
  });

  const chapters = Array.from(new Set(mediaList.map(m => m.chapter)));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card text-card-foreground shadow-xl">
            <CardHeader>
              <CardTitle>Edit Content Details</CardTitle>
              <CardDescription>Rename this part or move it to a different chapter folder.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Part Name / Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="e.g. Part 1" />
              </div>
              <div className="space-y-2">
                <Label>Chapter / Folder</Label>
                <Input value={editChapter} onChange={(e) => setEditChapter(e.target.value)} placeholder="e.g. Chapter 1" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingMedia(null)} disabled={savingEdit}>Cancel</Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSaveEdit} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard/admin/courses" className="hover:text-amber-600 transition-colors">Courses</Link>
            <span>/</span>
            <span>Course Media</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Media Manager</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Content Link</CardTitle>
              <CardDescription>Add Google Drive links for documents or YouTube links for videos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMedia} className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Chapter Folder</Label>
                  <Input 
                    value={uploadChapter} 
                    onChange={(e) => setUploadChapter(e.target.value)} 
                    placeholder="e.g. Chapter 1: Introduction"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Media Title</Label>
                  <Input 
                    value={newMediaTitle} 
                    onChange={(e) => setNewMediaTitle(e.target.value)} 
                    placeholder="e.g. Important Notes PDF"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Media Type</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-card text-card-foreground px-3 py-2 text-sm"
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as MediaType)}
                  >
                    <option value="document">Document / PDF</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>URL Link</Label>
                  <Input 
                    type="url"
                    value={newMediaUrl} 
                    onChange={(e) => setNewMediaUrl(e.target.value)} 
                    placeholder="https://drive.google.com/..."
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={adding}>
                  {adding ? 'Adding...' : 'Add Media'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Content Management Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
              <CardTitle>Course Content</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Input 
                  placeholder="Search media..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48"
                />
                <select 
                  className="border rounded-md px-3 py-2 text-sm bg-card text-card-foreground"
                  value={chapterFilter}
                  onChange={(e) => setChapterFilter(e.target.value)}
                >
                  <option value="">All Chapters</option>
                  {chapters.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading media...</div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                  No media content found for this course.
                </div>
              ) : (
                <div className="space-y-6">
                  {chapters.filter(c => chapterFilter ? c === chapterFilter : true).map(chapter => {
                    const chapterMedia = filteredMedia.filter(m => m.chapter === chapter);
                    if (chapterMedia.length === 0) return null;
                    
                    return (
                      <div key={chapter} className="space-y-3">
                        <h3 className="font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                          {chapter}
                        </h3>
                        <div className="space-y-2">
                          {chapterMedia.map(media => (
                            <div key={media.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 border rounded-lg hover:border-slate-300 transition-colors gap-4">
                              <div className="flex items-center gap-3 overflow-hidden w-full sm:w-auto">
                                <div className={`p-2 rounded-md flex-shrink-0 ${
                                  media.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                  media.type === 'document' ? 'bg-red-100 text-red-600' :
                                  media.type === 'audio' ? 'bg-purple-100 text-purple-600' :
                                  'bg-slate-200 text-muted-foreground'
                                }`}>
                                  {media.type === 'video' && (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  )}
                                  {media.type === 'document' && (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  )}
                                  {media.type === 'audio' && (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                  )}
                                  {media.type === 'image' && (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  )}
                                </div>
                                <div className="truncate">
                                  <p className="font-medium text-foreground truncate">{media.title}</p>
                                  <p className="text-xs text-muted-foreground uppercase">{media.fileExtension || media.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a 
                                  href={media.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Preview"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </a>
                                <button 
                                  onClick={() => handleEditClick(media)}
                                  className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                  title="Edit Name/Chapter"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button 
                                  onClick={() => handleDelete(media)}
                                  className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
