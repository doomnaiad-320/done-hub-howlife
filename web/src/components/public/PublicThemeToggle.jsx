import { useDispatch } from 'react-redux';
import { Monitor, Moon, Sun } from 'lucide-react';
import { SET_THEME } from 'store/actions';
import { useTranslation } from 'react-i18next';
import { cn } from './utils';

const getStoredThemeMode = () => localStorage.getItem('theme') || 'auto';

const getThemeIcon = (mode) => {
  switch (mode) {
    case 'light':
      return Sun;
    case 'dark':
      return Moon;
    default:
      return Monitor;
  }
};

const getThemeTooltip = (mode, t) => {
  switch (mode) {
    case 'light':
      return t('theme.light');
    case 'dark':
      return t('theme.dark');
    default:
      return t('theme.auto');
  }
};

const PublicThemeToggle = ({ className }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleThemeChange = () => {
    const currentMode = getStoredThemeMode();

    switch (currentMode) {
      case 'auto':
        localStorage.setItem('theme', 'light');
        dispatch({ type: SET_THEME, theme: 'light' });
        break;
      case 'light':
        localStorage.setItem('theme', 'dark');
        dispatch({ type: SET_THEME, theme: 'dark' });
        break;
      default: {
        localStorage.removeItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        dispatch({ type: SET_THEME, theme: prefersDark ? 'dark' : 'light' });
      }
    }
  };

  const mode = getStoredThemeMode();
  const Icon = getThemeIcon(mode);

  return (
    <button
      type="button"
      onClick={handleThemeChange}
      title={getThemeTooltip(mode, t)}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{getThemeTooltip(mode, t)}</span>
    </button>
  );
};

export default PublicThemeToggle;
