import { useI18n } from '@/i18n/context';
import type { Locale } from '@/i18n/types';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
];

/** 语言切换器：语言名自名（不翻译本身），切换即时生效、无刷新。 */
export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.035] p-0.5 text-[0.7rem] font-medium">
      {OPTIONS.map((option) => {
        const active = option.value === locale;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-2.5 py-1 transition-colors duration-200',
              active ? 'bg-white/[0.09] text-white' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
