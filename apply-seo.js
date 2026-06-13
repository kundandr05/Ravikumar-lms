const fs = require('fs');
const path = require('path');

const metadataMap = {
  'src/app/(public)/page.tsx': {
    title: 'RaviClasses LMS | Class 10 Expert Coaching',
    description: 'Welcome to RaviClasses. Empowering Class 10 students with comprehensive learning tools and expert guidance.',
    canonical: 'https://ravikumar-lms.vercel.app/'
  },
  'src/app/(public)/about/page.tsx': {
    title: 'About Us | RaviClasses',
    description: 'Learn about RaviClasses, our 17+ years of teaching excellence, and our mission to provide the best Class 10 coaching.',
    canonical: 'https://ravikumar-lms.vercel.app/about'
  },
  'src/app/(public)/courses/page.tsx': {
    title: 'Our Courses | RaviClasses',
    description: 'Explore our comprehensive Class 10 English and Social Science courses designed for board exam excellence.',
    canonical: 'https://ravikumar-lms.vercel.app/courses'
  },
  'src/app/(public)/results/page.tsx': {
    title: 'Student Results | RaviClasses',
    description: 'View the outstanding board exam results and success stories of our Class 10 students at RaviClasses.',
    canonical: 'https://ravikumar-lms.vercel.app/results'
  },
  'src/app/(public)/reviews/page.tsx': {
    title: 'Student Reviews | RaviClasses',
    description: 'Read what parents and students have to say about their learning experience with RaviClasses.',
    canonical: 'https://ravikumar-lms.vercel.app/reviews'
  },
  'src/app/(public)/contact/page.tsx': {
    title: 'Contact Us | RaviClasses',
    description: 'Get in touch with RaviClasses for admission inquiries, support, and guidance for Class 10 coaching.',
    canonical: 'https://ravikumar-lms.vercel.app/contact'
  },
  'src/app/(auth)/login/page.tsx': {
    title: 'Login | RaviClasses LMS',
    description: 'Access your RaviClasses student or admin dashboard to continue your learning journey.',
    canonical: 'https://ravikumar-lms.vercel.app/login'
  },
  'src/app/(auth)/register/page.tsx': {
    title: 'Register | RaviClasses LMS',
    description: 'Create an account at RaviClasses to enroll in Class 10 courses and access premium study materials.',
    canonical: 'https://ravikumar-lms.vercel.app/register'
  }
};

for (const [filePath, data] of Object.entries(metadataMap)) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (content.includes('export const metadata')) {
    console.log(`Metadata already exists in ${filePath}`);
    continue;
  }

  const metadataExport = `
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "${data.title}",
  description: "${data.description}",
  alternates: {
    canonical: "${data.canonical}",
  }
};
`;

  // If it's a client component, we must create a layout.tsx next to it instead.
  if (content.includes("'use client'") || content.includes('"use client"')) {
    const layoutPath = fullPath.replace('page.tsx', 'layout.tsx');
    if (!fs.existsSync(layoutPath)) {
      fs.writeFileSync(layoutPath, `
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "${data.title}",
  description: "${data.description}",
  alternates: {
    canonical: "${data.canonical}",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
      `, 'utf8');
      console.log(`Created layout.tsx for client component: ${filePath}`);
    } else {
      console.log(`layout.tsx already exists for ${filePath}`);
    }
  } else {
    // Server component: prepend import if necessary, otherwise just append metadata
    let newContent = content;
    if (!content.includes('import { Metadata }')) {
      newContent = `import { Metadata } from "next";\n` + newContent;
    }
    
    // Insert export before the default export
    newContent = newContent.replace('export default function', `export const metadata: Metadata = {
  title: "${data.title}",
  description: "${data.description}",
  alternates: {
    canonical: "${data.canonical}",
  }
};\n\nexport default function`);
    
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`Injected metadata into: ${filePath}`);
  }
}
