import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  CircleHelp,
  CreditCard,
  Languages,
  ShieldCheck,
  Sparkles,
  Waypoints
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PublicFooter from './PublicFooter';
import PublicNavbar from './PublicNavbar';

const PreviewFrame = ({ lightSrc, darkSrc, alt, className = '' }) => (
  <div className={`relative overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl shadow-black/10 ${className}`}>
    <img src={lightSrc} alt={`${alt} light`} className="block h-full w-full object-cover dark:hidden" />
    <img src={darkSrc} alt={`${alt} dark`} className="hidden h-full w-full object-cover dark:block" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
  </div>
);

const PublicLandingPage = () => {
  const { t } = useTranslation();
  const account = useSelector((state) => state.account);
  const siteInfo = useSelector((state) => state.siteInfo);

  const highlights = [
    {
      icon: Blocks,
      title: t('publicLanding.highlights.gateway.title'),
      description: t('publicLanding.highlights.gateway.description')
    },
    {
      icon: Waypoints,
      title: t('publicLanding.highlights.routing.title'),
      description: t('publicLanding.highlights.routing.description')
    },
    {
      icon: CreditCard,
      title: t('publicLanding.highlights.billing.title'),
      description: t('publicLanding.highlights.billing.description')
    },
    {
      icon: ShieldCheck,
      title: t('publicLanding.highlights.control.title'),
      description: t('publicLanding.highlights.control.description')
    }
  ];

  const featureGroups = [
    [
      t('publicLanding.features.group1.item1'),
      t('publicLanding.features.group1.item2'),
      t('publicLanding.features.group1.item3')
    ],
    [
      t('publicLanding.features.group2.item1'),
      t('publicLanding.features.group2.item2'),
      t('publicLanding.features.group2.item3')
    ]
  ];

  const faqs = [
    {
      question: t('publicLanding.faq.item1.question'),
      answer: t('publicLanding.faq.item1.answer')
    },
    {
      question: t('publicLanding.faq.item2.question'),
      answer: t('publicLanding.faq.item2.answer')
    },
    {
      question: t('publicLanding.faq.item3.question'),
      answer: t('publicLanding.faq.item3.answer')
    },
    {
      question: t('publicLanding.faq.item4.question'),
      answer: t('publicLanding.faq.item4.answer')
    }
  ];

  return (
    <div className="public-theme">
      <PublicNavbar />

      <main>
        <section className="public-spotlight relative overflow-hidden border-b border-border/70">
          <div className="public-dot-pattern absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_55%_55%_at_50%_35%,#000_60%,transparent_100%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(440px,560px)] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('publicLanding.hero.badge')}
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                {t('publicLanding.hero.titlePrefix')}{' '}
                <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                  {siteInfo.system_name || 'Done Hub'}
                </span>{' '}
                {t('publicLanding.hero.titleSuffix')}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                {t('description').replace(/\n/g, ' ')} {t('publicLanding.hero.subtitleSuffix')}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to={account.user ? '/panel' : '/register'}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  {account.user ? t('menu.console') : t('publicLanding.hero.primaryAction')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/price"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {t('publicLanding.hero.secondaryAction')}
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {highlights.slice(0, 2).map((item) => (
                  <div key={item.title} className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur">
                    <item.icon className="h-5 w-5 text-primary" />
                    <div className="mt-4 text-base font-semibold text-foreground">{item.title}</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-1/2 top-6 h-40 w-4/5 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
              <PreviewFrame lightSrc="/dashboard-light.png" darkSrc="/dashboard-dark.png" alt="Dashboard preview" className="public-float" />
            </div>
          </div>
        </section>

        <section className="border-b border-border/70 bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
                <Blocks className="h-4 w-4 text-primary" />
                {t('publicLanding.highlights.eyebrow')}
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t('publicLanding.highlights.title')}</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">{t('publicLanding.highlights.description')}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground">
                <Waypoints className="h-4 w-4 text-primary" />
                {t('publicLanding.features.eyebrow')}
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t('publicLanding.features.title')}</h2>
              <p className="text-lg leading-8 text-muted-foreground">{t('publicLanding.features.description')}</p>

              <div className="grid gap-3">
                {featureGroups[0].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm leading-6 text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <PreviewFrame lightSrc="/feature-1-light.png" darkSrc="/feature-1-dark.png" alt="Feature preview" />
          </div>

          <div className="mx-auto mt-14 grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
            <PreviewFrame lightSrc="/feature-2-light.png" darkSrc="/feature-2-dark.png" alt="Feature analytics preview" className="order-2 lg:order-1" />

            <div className="order-1 space-y-6 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground">
                <Languages className="h-4 w-4 text-primary" />
                {t('publicLanding.features.secondaryEyebrow')}
              </div>
              <h3 className="text-3xl font-semibold tracking-tight text-foreground">{t('publicLanding.features.secondaryTitle')}</h3>
              <p className="text-lg leading-8 text-muted-foreground">{t('publicLanding.features.secondaryDescription')}</p>

              <div className="grid gap-3">
                {featureGroups[1].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm leading-6 text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/price"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  {t('publicLanding.features.viewPricing')}
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {t('publicLanding.features.learnMore')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-y border-border/70 bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
                <CircleHelp className="h-4 w-4 text-primary" />
                FAQ
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t('publicLanding.faq.title')}</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">{t('publicLanding.faq.description')}</p>
            </div>

            <div className="mt-10 space-y-4">
              {faqs.map((item) => (
                <details key={item.question} className="group rounded-[24px] border border-border bg-card p-6 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CircleHelp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
                      <p className="mt-3 hidden text-sm leading-6 text-muted-foreground group-open:block">{item.answer}</p>
                    </div>
                  </summary>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-[32px] border border-border bg-card px-6 py-10 shadow-sm sm:px-8 lg:px-12">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t('publicLanding.cta.eyebrow')}
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t('publicLanding.cta.title')}</h2>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{t('publicLanding.cta.description')}</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                  <Link
                    to={account.user ? '/panel' : '/register'}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    {account.user ? t('menu.console') : t('publicLanding.cta.primaryAction')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {t('menu.login')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default PublicLandingPage;
