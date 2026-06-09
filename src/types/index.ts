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
