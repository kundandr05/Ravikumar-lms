export interface Course {
  courseId?: string;
  title: string;
  description: string;
  thumbnail?: string;
  createdAt: any; // Firestore Timestamp
}

export interface Lesson {
  lessonId?: string;
  courseId: string;
  title: string;
  videoUrl: string; // YouTube embed link
  notesPdf?: string; // Firebase Storage URL
  order: number; // For organizing chapters
  createdAt: any;
}

export interface Enrollment {
  enrollmentId?: string;
  studentId: string;
  courseId: string;
  enrolledAt: any;
  status?: string;
}

export interface Test {
  testId?: string;
  courseId: string;
  title: string;
  description: string;
  durationMinutes: number;
  createdAt: any;
}

export interface Question {
  questionId?: string;
  testId: string;
  text: string;
  options: string[]; // typically 4 options
  correctOptionIndex: number; // 0, 1, 2, or 3
  order: number;
}

export interface Announcement {
  announcementId?: string;
  title: string;
  message: string;
  targetAudience: string; // 'all' or courseId
  scheduledFor?: any; // Firestore Timestamp
  createdAt: any;
}

export interface AppNotification {
  notificationId?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export interface LessonProgress {
  progressId?: string;
  studentId: string;
  lessonId: string;
  courseId: string;
  completed: boolean;
  completedAt: any;
}

export interface StudyResource {
  resourceId?: string;
  title: string;
  description: string;
  category: string; // 'PDF', 'Worksheet', 'Question Bank'
  subject: string;
  fileUrl: string;
  createdAt: any;
}

export interface Bookmark {
  bookmarkId?: string;
  studentId: string;
  resourceId: string;
  createdAt: any;
}

export interface Feedback {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  category: string;
  message: string;
  rating?: number;
  status: 'pending' | 'reviewed' | 'resolved';
  adminReply?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  message: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export type MediaType = 'video' | 'audio' | 'document' | 'image' | 'youtube';

export interface MediaContent {
  id?: string;
  courseId: string;
  chapter: string; // Used to group content into chapters/topics
  title: string;
  description?: string;
  type: MediaType;
  url: string; // Firebase Storage URL or YouTube URL
  fileExtension?: string; // e.g., 'mp4', 'pdf', 'mp3'
  sizeBytes?: number;
  order: number;
  createdAt: any;
}

export interface MediaProgress {
  id?: string;
  studentId: string;
  mediaId: string;
  courseId: string;
  watchPercentage: number; // 0 to 100
  lastViewed: any;
  completed: boolean;
}
