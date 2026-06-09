'use client';

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaContent, MediaType } from '@/types';
import Link from 'next/link';

export default function CourseMediaManager({ params }: { params: { courseId: string } }) {
  const [mediaList, setMediaList] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const [chapterFilter, setChapterFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [uploadChapter, setUploadChapter] = useState('Chapter 1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, [params.courseId]);

  const fetchMedia = async () => {
    try {
      const q = query(
        collection(db, 'media'), 
        where('courseId', '==', params.courseId),
        // Note: orderBy requires a composite index if combined with where. 
        // We will sort client side to avoid needing an immediate index creation.
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

  const getMediaType = (file: File): MediaType => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'document';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    
    // Process sequentially to avoid memory issues on large videos
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `courses/${params.courseId}/media/${fileId}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          }, 
          (error) => {
            console.error("Upload error:", error);
            reject(error);
          }, 
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const newMedia: Omit<MediaContent, 'id'> = {
              courseId: params.courseId,
              chapter: uploadChapter || 'Uncategorized',
              title: file.name.split('.').slice(0, -1).join('.'), // filename without extension
              type: getMediaType(file),
              url: downloadURL,
              fileExtension: file.name.split('.').pop()?.toLowerCase() || '',
              sizeBytes: file.size,
              order: mediaList.length + i,
              createdAt: Timestamp.now(),
            };
            
            await addDoc(collection(db, 'media'), newMedia);
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            resolve();
          }
        );
      });
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchMedia();
  };

  const handleDelete = async (media: MediaContent) => {
    if (!confirm(`Are you sure you want to delete "${media.title}"?`)) return;
    
    try {
      // 1. Delete from Firestore
      if (media.id) {
        await deleteDoc(doc(db, 'media', media.id));
      }
      
      // 2. Delete from Storage if it's not a youtube link
      if (media.type !== 'youtube' && media.url.includes('firebasestorage')) {
        const fileRef = ref(storage, media.url);
        await deleteObject(fileRef).catch(err => console.log('Storage object not found or already deleted', err));
      }
      
      setMediaList(prev => prev.filter(m => m.id !== media.id));
    } catch (error) {
      console.error("Error deleting media:", error);
      alert("Failed to delete media.");
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link href="/dashboard/admin/courses" className="hover:text-amber-600 transition-colors">Courses</Link>
            <span>/</span>
            <span>Course Media</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Media Manager</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Content</CardTitle>
              <CardDescription>Upload videos, documents, and audio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Chapter/Topic</Label>
                <Input 
                  value={uploadChapter} 
                  onChange={(e) => setUploadChapter(e.target.value)} 
                  placeholder="e.g. Chapter 1: Introduction"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Files (Bulk Upload Supported)</Label>
                <Input 
                  type="file" 
                  multiple 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>
              
              {uploading && (
                <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                  <p className="text-sm font-medium text-slate-700">Uploading files...</p>
                  {Object.entries(uploadProgress).map(([filename, progress]) => (
                    <div key={filename} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[200px]">{filename}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  className="border rounded-md px-3 py-2 text-sm bg-white"
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
                <div className="text-center py-8 text-slate-500">Loading media...</div>
              ) : filteredMedia.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-slate-500">
                  No media content found for this course.
                </div>
              ) : (
                <div className="space-y-6">
                  {chapters.filter(c => chapterFilter ? c === chapterFilter : true).map(chapter => {
                    const chapterMedia = filteredMedia.filter(m => m.chapter === chapter);
                    if (chapterMedia.length === 0) return null;
                    
                    return (
                      <div key={chapter} className="space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b pb-2">{chapter}</h3>
                        <div className="space-y-2">
                          {chapterMedia.map(media => (
                            <div key={media.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg hover:border-slate-300 transition-colors">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-md flex-shrink-0 ${
                                  media.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                  media.type === 'document' ? 'bg-red-100 text-red-600' :
                                  media.type === 'audio' ? 'bg-purple-100 text-purple-600' :
                                  'bg-slate-200 text-slate-600'
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
                                  <p className="font-medium text-slate-900 truncate">{media.title}</p>
                                  <p className="text-xs text-slate-500 uppercase">{media.fileExtension || media.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a 
                                  href={media.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Preview"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                </a>
                                <button 
                                  onClick={() => handleDelete(media)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
