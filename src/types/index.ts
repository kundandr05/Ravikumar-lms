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
