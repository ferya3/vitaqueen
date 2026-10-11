import { CheckCircle2 } from 'lucide-react';

export function CreatedNotice({ children = 'ایجاد شد. می‌توانید ادامه‌ی جزئیات را تکمیل کنید.' }: { children?: React.ReactNode }) {
  return (
    <p role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-mint-300 bg-mint-100 px-4 py-3 text-sm text-mint-700">
      <CheckCircle2 className="size-4" />
      {children}
    </p>
  );
}
