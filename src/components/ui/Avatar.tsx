import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  verified?: boolean;
  className?: string;
}

export default function Avatar({ src, name, size = 'md', verified, className }: AvatarProps) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' };
  const badgeSizes = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };

  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={56}
          height={56}
          className={cn('rounded-full object-cover', sizes[size])}
        />
      ) : (
        <div className={cn('rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-medium', sizes[size])}>
          {getInitials(name)}
        </div>
      )}
      {verified && (
        <div className={cn('absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white', badgeSizes[size])}>
          <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
