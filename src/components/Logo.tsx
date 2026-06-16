import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ href = '/', className = '', size = 28, showText = true }: LogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className}`}>
      {/* Icon Container with semantic theme tokens */}
      <div className="relative flex items-center justify-center p-1 rounded-lg bg-background border border-border shadow-sm shrink-0 transition-colors">
        <Image 
          src="/logo.png" 
          alt="RaviClasses Logo Icon" 
          width={size} 
          height={size} 
          className="rounded-md object-contain dark:brightness-110 dark:contrast-125 transition-all" 
        />
      </div>
      
      {/* Text Container with semantic theme tokens */}
      {showText && (
        <span className="text-xl font-bold text-foreground tracking-tight transition-colors">
          Ravi<span className="text-amber-500">Classes</span>
        </span>
      )}
    </Link>
  );
}
