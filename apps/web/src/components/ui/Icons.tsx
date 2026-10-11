import { ArrowRight, ChevronDown, Download, Globe, X, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The site's icon vocabulary, drawn from lucide-react.
 *
 * Wrapped rather than imported directly at each call site for two reasons:
 * one stroke weight and size for the whole public site, and an arrow that
 * points the way the reader is going in any script.
 */
type IconProps = Omit<LucideProps, 'ref'>;

const base = 'size-4 shrink-0';

export function ArrowIcon({ className, ...props }: IconProps) {
  return <ArrowRight aria-hidden strokeWidth={1.75} className={cn(base, 'rtl:-scale-x-100', className)} {...props} />;
}

export function ChevronIcon({ className, ...props }: IconProps) {
  return <ChevronDown aria-hidden strokeWidth={1.75} className={cn(base, className)} {...props} />;
}

export function DownloadIcon({ className, ...props }: IconProps) {
  return <Download aria-hidden strokeWidth={1.75} className={cn(base, className)} {...props} />;
}

export function CloseIcon({ className, ...props }: IconProps) {
  return <X aria-hidden strokeWidth={1.75} className={cn(base, className)} {...props} />;
}

export function GlobeIcon({ className, ...props }: IconProps) {
  return <Globe aria-hidden strokeWidth={1.6} className={cn(base, className)} {...props} />;
}
