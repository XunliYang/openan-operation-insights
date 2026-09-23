import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useI18n } from '@/i18n/context';
import { TopNav } from './TopNav';

/** 全局布局：顶部导航 + 内容容器 + 页脚，并在路由切换时回到顶部 */
export function AppShell() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <TopNav />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>

      <footer className="mt-6 border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{t('common.footer.contract')}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t('common.footer.readonly')}</span>
            <span className="hidden text-slate-600 sm:inline">|</span>
            <span>{t('common.footer.metricsGuide')}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
