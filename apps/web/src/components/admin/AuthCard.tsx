import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

/** The frame around sign-in and second-factor screens. */
export function AuthCard({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(48rem_32rem_at_80%_0%,var(--color-aqua-100),transparent_65%)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center text-heading">
          <Logo label="VitaQueen" />
        </div>
        <div className="glass-strong rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl font-bold text-heading">{title}</h1>
          {description ? <div className="mt-2 text-sm leading-relaxed text-ink-500">{description}</div> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
