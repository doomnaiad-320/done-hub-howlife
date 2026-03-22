import { useEffect, useMemo, useRef, useState } from 'react';
import Flags from 'country-flag-icons/react/3x2';
import { ChevronDown, Languages } from 'lucide-react';
import i18nList from 'i18n/i18nList';
import useI18n from 'hooks/useI18n';
import { cn } from './utils';

const PublicLanguageMenu = ({ className, compact = false, iconOnly = false }) => {
  const i18n = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLanguage = useMemo(() => {
    return i18nList.find((item) => item.lng === i18n.language) || i18nList[0];
  }, [i18n.language]);

  const CurrentFlag = Flags[currentLanguage.countryCode];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        title={currentLanguage.name}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
          iconOnly && 'w-10 justify-center px-0'
        )}
      >
        {iconOnly ? <Languages className="h-4 w-4" /> : CurrentFlag ? <CurrentFlag className="h-4 w-5 rounded-[2px]" /> : null}
        {!compact && !iconOnly ? <span>{currentLanguage.name}</span> : null}
        {!iconOnly ? <ChevronDown className="h-4 w-4" /> : null}
        <span className="sr-only">{currentLanguage.name}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          {i18nList.map((item) => {
            const FlagComponent = Flags[item.countryCode];
            const active = item.lng === currentLanguage.lng;

            return (
              <button
                key={item.lng}
                type="button"
                onClick={() => {
                  i18n.changeLanguage(item.lng);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  active && 'bg-accent text-accent-foreground'
                )}
              >
                {FlagComponent ? <FlagComponent className="h-4 w-5 rounded-[2px]" /> : null}
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default PublicLanguageMenu;
