import type { ReactNode } from 'react';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      {children}
    </>
  );
}
