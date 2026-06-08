import { Card, CardContent } from '@/components/ui/card';

export default function DemoPage() {
  const demos = [
    {
      title: "Class 10 English - First Flight Overview",
      videoId: "dQw4w9WgXcQ", // Placeholder rickroll, user can replace
      subject: "English"
    },
    {
      title: "The Rise of Nationalism in Europe",
      videoId: "dQw4w9WgXcQ", 
      subject: "Social Science"
    }
  ];

  return (
    <div className="py-20 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Free Demo Lectures</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Experience Ravi Sir's unique teaching methodology before you enroll.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {demos.map((demo, idx) => (
            <Card key={idx} className="overflow-hidden shadow-lg border-0">
              <div className="aspect-video bg-slate-900 relative">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${demo.videoId}`} 
                  title={demo.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>
              <CardContent className="p-6">
                <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold mb-3 uppercase tracking-wider">
                  {demo.subject}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{demo.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
