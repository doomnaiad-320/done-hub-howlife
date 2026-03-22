import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Info, Link2, Tags, X } from 'lucide-react';
import { copy } from 'utils/common';
import { useTranslation } from 'react-i18next';
import { MODALITY_OPTIONS } from 'constants/Modality';
import { cn } from 'components/public/utils';
import { inferApiEndpoints, parseJsonArray } from './modelEndpointUtils';

const endpointToneMap = {
  primary: 'border-border bg-background text-foreground',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
};

const tagToneMap = {
  primary: 'border-border bg-background text-foreground',
  secondary: 'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  error: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
};

const getProtocolLabel = (protocol) => {
  switch (protocol) {
    case 'openai':
      return 'OpenAI';
    case 'gemini':
      return 'Gemini';
    case 'claude':
      return 'Claude';
    default:
      return protocol;
  }
};

const DetailRow = ({ label, children }) => (
  <div className="grid gap-2 border-b border-border/70 py-2.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-center">
    <div className="text-sm font-medium text-muted-foreground">{label}</div>
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node
};

export default function ModelDetailPanel({ open, model, provider, modelInfo, priceData, ownedbyIcon, formatPrice, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !model) {
    return null;
  }

  const inputModalities = modelInfo ? parseJsonArray(modelInfo.input_modalities) : [];
  const outputModalities = modelInfo ? parseJsonArray(modelInfo.output_modalities) : [];
  const tags = modelInfo ? parseJsonArray(modelInfo.tags) : [];
  const apiEndpoints = inferApiEndpoints({
    model,
    provider,
    inputModalities,
    outputModalities
  });

  const modal = (
    <div
      className="fixed inset-0 z-[1400] flex items-stretch justify-end bg-transparent p-3 sm:p-4 lg:p-6"
      onClick={onClose}
    >
      <div
        className="public-scope flex h-full w-full max-w-[820px] flex-col overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] border border-border bg-background shadow-sm">
              {ownedbyIcon ? (
                <img src={ownedbyIcon} alt={provider} className="h-8 w-8 object-contain" />
              ) : (
                <span className="text-base font-semibold text-foreground">{provider?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground">{modelInfo?.name || model}</h2>
                {tags.some((tag) => tag.toLowerCase() === 'hot') ? (
                  <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                    Hot
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{model}</span>
                <button
                  type="button"
                  onClick={() => copy(model, t('modelpricePage.modelId'))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
                  {provider}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          {modelInfo?.description ? (
            <div className="rounded-[24px] border border-border bg-background/70 p-4 text-sm leading-7 text-muted-foreground">
              {modelInfo.description}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <section className="rounded-[28px] border border-border bg-background/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{t('modelpricePage.modelInfo')}</h3>
              </div>

              <div>
                <DetailRow label={t('modelpricePage.type')}>
                  <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {priceData?.price?.type === 'tokens' ? t('modelpricePage.tokens') : t('modelpricePage.times')}
                  </span>
                </DetailRow>

                {modelInfo?.context_length > 0 ? (
                  <DetailRow label={t('modelpricePage.contextLength')}>{modelInfo.context_length.toLocaleString()}</DetailRow>
                ) : null}

                {modelInfo?.max_tokens > 0 ? (
                  <DetailRow label={t('modelpricePage.maxTokens')}>{modelInfo.max_tokens.toLocaleString()}</DetailRow>
                ) : null}

                {inputModalities.length > 0 ? (
                  <DetailRow label={t('modelpricePage.inputModality')}>
                    <div className="flex flex-wrap gap-2">
                      {inputModalities.map((modality) => (
                        <span
                          key={modality}
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                            tagToneMap[MODALITY_OPTIONS[modality]?.color] || tagToneMap.primary
                          )}
                        >
                          {MODALITY_OPTIONS[modality]?.text || modality}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                ) : null}

                {outputModalities.length > 0 ? (
                  <DetailRow label={t('modelpricePage.outputModality')}>
                    <div className="flex flex-wrap gap-2">
                      {outputModalities.map((modality) => (
                        <span
                          key={modality}
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                            tagToneMap[MODALITY_OPTIONS[modality]?.color] || tagToneMap.secondary
                          )}
                        >
                          {MODALITY_OPTIONS[modality]?.text || modality}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                ) : null}

                {tags.length > 0 ? (
                  <DetailRow label={t('modelpricePage.tags')}>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            'inline-flex rounded-full border px-2.5 py-1 text-xs font-medium',
                            tag.toLowerCase() === 'hot' ? tagToneMap.error : tagToneMap.primary
                          )}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                ) : null}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-background/70 p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{t('modelpricePage.apiEndpoints')}</h3>
              </div>
              <p className="mb-4 text-sm leading-6 text-muted-foreground">{t('modelpricePage.apiEndpointsDesc')}</p>

              <div className="space-y-3">
                {apiEndpoints.map((endpoint) => (
                  <div key={`${endpoint.protocol}-${endpoint.path}`} className="rounded-[22px] border border-border bg-card px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                            endpointToneMap[endpoint.color] || endpointToneMap.primary
                          )}
                        >
                          {getProtocolLabel(endpoint.protocol)}
                        </span>
                        <span className="inline-flex w-fit items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {endpoint.method}
                        </span>
                      </div>
                      <code className="break-all text-xs leading-6 text-foreground">{endpoint.path}</code>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-background/70 p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">{t('modelpricePage.priceDetails')}</h3>
              </div>
              <p className="mb-4 text-sm leading-6 text-muted-foreground">{t('modelpricePage.priceNote')}</p>

              <div className="overflow-x-auto rounded-[22px] border border-border">
                <table className="min-w-[420px] w-full border-collapse text-sm">
                  <thead className="bg-background">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-semibold text-foreground">{t('modelpricePage.group')}</th>
                      <th className="px-4 py-3 font-semibold text-foreground">{t('modelpricePage.input')}</th>
                      <th className="px-4 py-3 font-semibold text-foreground">{t('modelpricePage.output')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceData?.allGroupPrices?.map((groupPrice) => (
                      <tr key={groupPrice.groupKey} className="border-t border-border bg-card/80">
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground">
                            {groupPrice.groupName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-700 dark:text-emerald-300">{formatPrice(groupPrice.input, groupPrice.type)}</td>
                        <td className="px-4 py-3 text-amber-700 dark:text-amber-300">{formatPrice(groupPrice.output, groupPrice.type)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {priceData?.price?.extra_ratios && Object.keys(priceData.price.extra_ratios).length > 0 ? (
              <section className="rounded-[28px] border border-border bg-background/70 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{t('modelpricePage.otherInfo')}</h3>
                </div>

                <div className="space-y-3">
                  {Object.entries(priceData.price.extra_ratios).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3 rounded-[18px] border border-border bg-card px-4 py-3">
                      <span className="text-sm font-medium text-muted-foreground">{t(`modelpricePage.${key}`)}</span>
                      <span className="text-sm font-semibold text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

ModelDetailPanel.propTypes = {
  open: PropTypes.bool,
  model: PropTypes.string,
  provider: PropTypes.string,
  modelInfo: PropTypes.object,
  priceData: PropTypes.object,
  ownedbyIcon: PropTypes.string,
  formatPrice: PropTypes.func,
  onClose: PropTypes.func
};
