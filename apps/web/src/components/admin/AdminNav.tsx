'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  Factory,
  FileText,
  FlaskConical,
  History,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  MapPin,
  Newspaper,
  Package,
  Settings,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { atLeast, type Role } from '@/lib/roles';
import { cn } from '@/lib/cn';

type Item = { href: string; label: string; icon: LucideIcon; min?: Role };

const GROUPS: Array<{ title?: string; items: Item[] }> = [
  { items: [{ href: '/admin', label: 'داشبورد', icon: LayoutDashboard }] },
  {
    title: 'کاتالوگ و کیفیت',
    items: [
      { href: '/admin/products', label: 'محصولات', icon: Package },
      { href: '/admin/certificates', label: 'گواهی‌نامه‌ها', icon: Award },
      { href: '/admin/analyses', label: 'آنالیز آب', icon: FlaskConical },
      { href: '/admin/source', label: 'مشخصات چشمه', icon: MapPin },
      { href: '/admin/stages', label: 'مراحل تولید', icon: Factory },
    ],
  },
  {
    title: 'محتوا',
    items: [
      { href: '/admin/news', label: 'اخبار', icon: Newspaper },
      { href: '/admin/pages', label: 'صفحات حقوقی', icon: FileText },
      { href: '/admin/distributors', label: 'نمایندگان', icon: Truck },
      { href: '/admin/media', label: 'رسانه‌ها', icon: ImageIcon },
    ],
  },
  {
    title: 'مدیریت',
    items: [
      { href: '/admin/messages', label: 'پیام‌ها', icon: Inbox, min: 'editor' },
      { href: '/admin/users', label: 'کاربران', icon: Users, min: 'admin' },
      { href: '/admin/audit', label: 'گزارش رویدادها', icon: History, min: 'admin' },
      { href: '/admin/account', label: 'حساب من', icon: Settings },
    ],
  },
];

export function AdminNav({ role, unread }: { role: Role; unread: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="پنل مدیریت" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0">
      {GROUPS.map((group, index) => (
        <div key={index} className="flex shrink-0 gap-1 lg:flex-col">
          {group.title ? (
            <p className="hidden px-3 pb-1 text-2xs font-semibold tracking-wide text-ink-400 lg:block">{group.title}</p>
          ) : null}
          {group.items
            .filter((item) => !item.min || atLeast(role, item.min))
            .map((item) => {
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors',
                    active ? 'bg-aqua-500/12 font-semibold text-aqua-800' : 'text-ink-600 hover:bg-ink-900/5 hover:text-heading',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                  {item.href === '/admin/messages' && unread > 0 ? (
                    <span className="ms-auto rounded-pill bg-aqua-500 px-2 py-0.5 text-2xs font-bold text-white">{unread}</span>
                  ) : null}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}
