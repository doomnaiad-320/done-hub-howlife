import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Github, LayoutDashboard, LogIn, Menu, UserPlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PublicLanguageMenu from './PublicLanguageMenu';
import PublicLogo from './PublicLogo';
import PublicThemeToggle from './PublicThemeToggle';
import { cn } from './utils';

const PublicNavbar = ({ landingAnchors = true }) => {
  const { t } = useTranslation();
  const account = useSelector((state) => state.account);
  const siteInfo = useSelector((state) => state.siteInfo);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const anchorPrefix = location.pathname === '/' ? '' : '/';
  const navItems = [
    ...(landingAnchors
      ? [
          {
            label: t('publicLanding.nav.features'),
            href: `${anchorPrefix}#features`
          },
          {
            label: t('publicLanding.nav.faq'),
            href: `${anchorPrefix}#faq`
          }
        ]
      : []),
    {
      label: t('price'),
      to: '/price'
    },
    {
      label: t('menu.about'),
      to: '/about'
    }
  ];

  if (siteInfo.UptimeEnabled && siteInfo.UptimeDomain) {
    navItems.push({
      label: t('menu.status'),
      href: siteInfo.UptimeDomain,
      external: true
    });
  }

  const renderNavLink = (item, mobile = false) => {
    const className = cn(
      'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
      mobile && 'flex rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground'
    );

    if (item.to) {
      return (
        <Link key={item.label} to={item.to} className={className} onClick={() => setMobileOpen(false)}>
          {item.label}
        </Link>
      );
    }

    return (
      <a
        key={item.label}
        href={item.href}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noreferrer' : undefined}
        className={className}
        onClick={() => setMobileOpen(false)}
      >
        {item.label}
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-2xl border border-border bg-card px-2 py-1.5 shadow-sm">
            <PublicLogo className="h-8" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-foreground">{siteInfo.system_name || 'Done Hub'}</div>
            <div className="text-xs text-muted-foreground">{t('publicLanding.nav.tagline')}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">{navItems.map((item) => renderNavLink(item))}</nav>

        <div className="hidden items-center gap-3 lg:flex">
          <PublicThemeToggle />
          <PublicLanguageMenu />
          <a
            href="https://github.com/deanxv/done-hub"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>
          {account.user ? (
            <Link
              to="/panel"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('menu.console')}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogIn className="h-4 w-4" />
                {t('menu.login')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                <UserPlus className="h-4 w-4" />
                {t('menu.signup')}
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground lg:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span className="sr-only">{mobileOpen ? 'Close' : 'Open'} menu</span>
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              <PublicThemeToggle className="w-full rounded-2xl" />
              <PublicLanguageMenu compact className="w-full" />
            </div>

            <div className="flex flex-col gap-3">{navItems.map((item) => renderNavLink(item, true))}</div>

            {account.user ? (
              <Link
                to="/panel"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                {t('menu.console')}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground"
                >
                  <LogIn className="h-4 w-4" />
                  {t('menu.login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  <UserPlus className="h-4 w-4" />
                  {t('menu.signup')}
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
};

export default PublicNavbar;
