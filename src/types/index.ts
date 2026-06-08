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
  studentId: string;
  courseId: string;
  enrolledAt: any;
}
