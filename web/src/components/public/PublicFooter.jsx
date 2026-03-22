import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PublicLogo from './PublicLogo';

const PublicFooter = () => {
  const { t } = useTranslation();
  const siteInfo = useSelector((state) => state.siteInfo);

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-card px-2 py-1.5 shadow-sm">
              <PublicLogo className="h-8" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{siteInfo.system_name || 'Done Hub'}</div>
              <div className="text-xs text-muted-foreground">{t('publicLanding.footer.tagline')}</div>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{t('publicLanding.footer.description')}</p>
          <a
            href="https://github.com/deanxv/done-hub"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t('publicLanding.footer.product')}</h3>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">
              {t('menu.home')}
            </Link>
            <Link to="/price" className="transition-colors hover:text-foreground">
              {t('price')}
            </Link>
            <Link to="/about" className="transition-colors hover:text-foreground">
              {t('menu.about')}
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t('publicLanding.footer.account')}</h3>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <Link to="/login" className="transition-colors hover:text-foreground">
              {t('menu.login')}
            </Link>
            <Link to="/register" className="transition-colors hover:text-foreground">
              {t('menu.signup')}
            </Link>
            <Link to="/panel" className="transition-colors hover:text-foreground">
              {t('menu.console')}
            </Link>
          </div>
        </div>
      </div>

      {siteInfo.footer_html ? (
        <div className="border-t border-border/70 px-4 py-4 sm:px-6 lg:px-8">
          <div
            className="mx-auto max-w-7xl text-sm text-muted-foreground [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: siteInfo.footer_html }}
          />
        </div>
      ) : null}

      <div className="border-t border-border/70 px-4 py-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        {t('publicLanding.footer.copyright', { year: new Date().getFullYear(), system: siteInfo.system_name || 'Done Hub' })}
      </div>
    </footer>
  );
};

export default PublicFooter;
