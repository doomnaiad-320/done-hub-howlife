import { CheckCircle2 } from 'lucide-react';
import PublicNavbar from './PublicNavbar';

const PublicAuthShell = ({
  title,
  description,
  previewEyebrow,
  previewTitle,
  previewDescription,
  previewItems,
  imageLight,
  imageDark,
  children
}) => {
  return (
    <div className="public-theme flex min-h-screen flex-col bg-background">
      <PublicNavbar landingAnchors={false} />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(460px,560px)]">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-muted/30">
          <div className="flex flex-1 items-center justify-center px-6 py-8 md:px-8 md:py-10">
            <div className="w-full max-w-xl rounded-[32px] border border-border bg-card p-6 shadow-lg shadow-black/5 sm:p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
              {children}
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden border-l border-border bg-background lg:block">
          <div className="public-dot-pattern absolute inset-0 opacity-70" />
          <div className="absolute left-1/2 top-20 h-48 w-4/5 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative flex h-full flex-col justify-center px-10 py-12">
            <div className="mb-5 inline-flex w-fit items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
              {previewEyebrow}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">{previewTitle}</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{previewDescription}</p>

            <div className="mt-8 space-y-3">
              {previewItems.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 px-4 py-4 shadow-sm backdrop-blur">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-6 text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl shadow-black/10">
              <img src={imageLight} alt="Preview light" className="block h-full w-full object-cover dark:hidden" />
              <img src={imageDark} alt="Preview dark" className="hidden h-full w-full object-cover dark:block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAuthShell;
