import PropTypes from 'prop-types';
import { Copy } from 'lucide-react';
import { copy } from 'utils/common';
import { useTranslation } from 'react-i18next';
import { MODALITY_OPTIONS } from 'constants/Modality';
import { cn } from 'components/public/utils';
import { inferApiEndpoints, parseJsonArray } from './modelEndpointUtils';

const endpointToneMap = {
  primary: 'bg-muted text-foreground',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
};

const modalityToneMap = {
  primary: 'bg-muted text-foreground',
  secondary: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  info: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  error: 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
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

export default function ModelCard({ model, provider, modelInfo, price, group, ownedbyIcon, type, formatPrice, onViewDetail }) {
  const { t } = useTranslation();

  const inputModalities = modelInfo ? parseJsonArray(modelInfo.input_modalities) : [];
  const outputModalities = modelInfo ? parseJsonArray(modelInfo.output_modalities) : [];
  const tags = modelInfo ? parseJsonArray(modelInfo.tags) : [];
  const displayName = modelInfo?.name || model;
  const apiEndpoints = inferApiEndpoints({
    model,
    provider,
    inputModalities,
    outputModalities
  });

  const endpointTypes = Array.from(
    new Map(
      apiEndpoints.map((endpoint) => [
        endpoint.protocol,
        {
          key: endpoint.protocol,
          label: getProtocolLabel(endpoint.protocol),
          color: endpoint.color
        }
      ])
    ).values()
  );

  const metaTags = [
    ...inputModalities.slice(0, 2).map((modality) => ({
      key: `input-${modality}`,
      label: MODALITY_OPTIONS[modality]?.text || modality,
      color: MODALITY_OPTIONS[modality]?.color || 'primary'
    })),
    ...outputModalities.slice(0, 2).map((modality) => ({
      key: `output-${modality}`,
      label: MODALITY_OPTIONS[modality]?.text || modality,
      color: MODALITY_OPTIONS[modality]?.color || 'secondary'
    })),
    ...tags.slice(0, 2).map((tag) => ({
      key: `tag-${tag}`,
      label: tag,
      color: tag.toLowerCase() === 'hot' ? 'error' : 'primary'
    }))
  ].slice(0, 3);

  const billingTone =
    type === 'times'
      ? 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
      : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300';

  const priceValueClass =
    type === 'times' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300';

  const priceRowClass = type === 'times' ? 'bg-amber-500/8' : 'bg-emerald-500/8';

  return (
    <button
      type="button"
      onClick={onViewDetail}
      className="flex h-full w-full flex-col rounded-[24px] border border-border/70 bg-card p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-muted shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          {ownedbyIcon ? (
            <img src={ownedbyIcon} alt={provider} className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-sm font-semibold text-foreground">{provider?.charAt(0)?.toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-foreground">{displayName}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{model}</p>
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                copy(model, t('modelpricePage.modelId'));
              }}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">{t('modelpricePage.copyModelId')}</span>
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {provider}
            </span>
            {endpointTypes.slice(0, 2).map((endpoint) => (
              <span
                key={endpoint.key}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                  endpointToneMap[endpoint.color] || endpointToneMap.primary
                )}
              >
                {endpoint.label}
              </span>
            ))}
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', billingTone)}>
              {type === 'times' ? t('modelpricePage.times') : t('modelpricePage.tokens')}
            </span>
          </div>
        </div>
      </div>

      <div className={cn('mt-3 grid gap-2 rounded-[18px] px-3 py-2.5 sm:grid-cols-2', priceRowClass)}>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{t('modelpricePage.input')}</div>
          <div className={cn('mt-1 truncate text-sm font-semibold', priceValueClass)}>{formatPrice(price.input, type)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{t('modelpricePage.output')}</div>
          <div className={cn('mt-1 truncate text-sm font-semibold', priceValueClass)}>{formatPrice(price.output, type)}</div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-1 flex-wrap content-start gap-1.5">
        {metaTags.map((item) => (
          <span
            key={item.key}
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
              modalityToneMap[item.color] || modalityToneMap.primary
            )}
          >
            {item.label}
          </span>
        ))}

        {group?.ratio > 1 ? (
          <span className="inline-flex items-center rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            x{group.ratio}
          </span>
        ) : null}
      </div>
    </button>
  );
}

ModelCard.propTypes = {
  model: PropTypes.string.isRequired,
  provider: PropTypes.string.isRequired,
  modelInfo: PropTypes.object,
  price: PropTypes.object.isRequired,
  group: PropTypes.object,
  ownedbyIcon: PropTypes.string,
  unit: PropTypes.string,
  type: PropTypes.string,
  formatPrice: PropTypes.func,
  onViewDetail: PropTypes.func
};
