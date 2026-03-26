import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Globe,
  Grid2x2,
  Layers3,
  List,
  Search,
  SlidersHorizontal,
  Tags,
  Users,
  X
} from 'lucide-react';
import { API } from 'utils/api';
import { showError, ValueFormatter, copy } from 'utils/common';
import { cn } from 'components/public/utils';
import { MODALITY_OPTIONS } from 'constants/Modality';
import ModelCard from './component/ModelCard';
import ModelDetailPanel from './component/ModelDetailPanel';
import { parseJsonArray } from './component/modelEndpointUtils';

const surfaceClass = 'rounded-[28px] border border-border bg-card shadow-sm';

const filterToneMap = {
  primary: 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/15 dark:text-sky-300',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300',
  error: 'border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300'
};

const activeToneMap = {
  primary: 'border-primary bg-primary/12 text-primary shadow-sm shadow-primary/10',
  info: 'border-sky-500/40 bg-sky-500/14 text-sky-700 shadow-sm shadow-sky-500/10 dark:text-sky-300',
  success: 'border-emerald-500/40 bg-emerald-500/14 text-emerald-700 shadow-sm shadow-emerald-500/10 dark:text-emerald-300',
  warning: 'border-amber-500/40 bg-amber-500/14 text-amber-700 shadow-sm shadow-amber-500/10 dark:text-amber-300',
  error: 'border-rose-500/40 bg-rose-500/14 text-rose-700 shadow-sm shadow-rose-500/10 dark:text-rose-300'
};

const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis-right', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis-left', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, 'ellipsis-left', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-right', totalPages];
};

const FilterChip = ({ active, onClick, children, icon, tone = 'primary', className, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200',
      active ? activeToneMap[tone] || activeToneMap.primary : filterToneMap[tone] || filterToneMap.primary,
      className
    )}
  >
    {icon}
    <span>{children}</span>
  </button>
);

const SectionHeading = ({ icon: Icon, title, action }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    {action}
  </div>
);

export default function ModelPrice() {
  const { t } = useTranslation();
  const ownedby = useSelector((state) => state.siteInfo?.ownedby || []);

  const [availableModels, setAvailableModels] = useState({});
  const [modelInfoMap, setModelInfoMap] = useState({});
  const [userGroupMap, setUserGroupMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedOwnedBy, setSelectedOwnedBy] = useState('all');
  const [unit, setUnit] = useState('M');
  const [onlyShowAvailable, setOnlyShowAvailable] = useState(true);
  const [selectedModality, setSelectedModality] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewMode, setViewMode] = useState('card');
  const [selectedModelDetail, setSelectedModelDetail] = useState(null);

  const unitOptions = [
    { value: 'K', label: 'K' },
    { value: 'M', label: 'M' }
  ];

  const pageSizeOptions = [20, 30, 60, 100];

  const fetchAvailableModels = useCallback(async () => {
    try {
      const res = await API.get('/api/available_model');
      const { success, message, data } = res.data;
      if (success) {
        setAvailableModels(data);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchModelInfo = useCallback(async () => {
    try {
      const res = await API.get('/api/model_info/');
      const { success, message, data } = res.data;
      if (success) {
        const infoMap = {};
        data.forEach((info) => {
          infoMap[info.model] = info;
        });
        setModelInfoMap(infoMap);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchUserGroupMap = useCallback(async () => {
    try {
      const res = await API.get('/api/user_group_map');
      const { success, message, data } = res.data;
      if (success) {
        setUserGroupMap(data);
        const firstGroup = Object.keys(data)[0] || '';
        setSelectedGroup((current) => current || firstGroup);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchAvailableModels();
    fetchModelInfo();
    fetchUserGroupMap();
  }, [fetchAvailableModels, fetchModelInfo, fetchUserGroupMap]);

  const allTags = useMemo(
    () =>
      [
        ...new Set(
          Object.values(modelInfoMap).flatMap((info) => {
            return parseJsonArray(info.tags);
          })
        )
      ].sort((a, b) => a.localeCompare(b)),
    [modelInfoMap]
  );

  const formatPrice = (value, type) => {
    if (typeof value === 'number') {
      let nowUnit = '';
      let isM = unit === 'M';
      if (type === 'times') {
        isM = false;
        nowUnit = t('modelpricePage.perRequestSuffix');
      }
      if (type === 'tokens') {
        nowUnit = `/ 1${unit}`;
      }
      return ValueFormatter(value, true, isM) + nowUnit;
    }
    return value;
  };

  const filteredModels = useMemo(() => {
    return Object.entries(availableModels)
      .filter(([modelName, model]) => {
        if (selectedOwnedBy !== 'all' && model.owned_by !== selectedOwnedBy) {
          return false;
        }

        if (onlyShowAvailable && (!selectedGroup || !model.groups.includes(selectedGroup))) {
          return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const modelInfo = modelInfoMap[modelName];
          const displayName = modelInfo?.name || modelName;
          const matchModel = modelName.toLowerCase().includes(query);
          const matchDisplayName = displayName.toLowerCase().includes(query);
          const matchDescription = modelInfo?.description?.toLowerCase().includes(query);
          if (!matchModel && !matchDisplayName && !matchDescription) {
            return false;
          }
        }

        if (selectedModality !== 'all') {
          const modelInfo = modelInfoMap[modelName];
          const inputModalities = parseJsonArray(modelInfo?.input_modalities);
          const outputModalities = parseJsonArray(modelInfo?.output_modalities);
          if (!inputModalities.includes(selectedModality) && !outputModalities.includes(selectedModality)) {
            return false;
          }
        }

        if (selectedTag !== 'all') {
          const modelInfo = modelInfoMap[modelName];
          const tags = parseJsonArray(modelInfo?.tags);
          if (!tags.includes(selectedTag)) {
            return false;
          }
        }

        return true;
      })
      .map(([modelName, model]) => {
        const currentGroup = selectedGroup ? userGroupMap[selectedGroup] : null;
        const hasAccess = currentGroup ? model.groups.includes(selectedGroup) : false;
        const price = hasAccess
          ? {
              input: currentGroup.ratio * model.price.input,
              output: currentGroup.ratio * model.price.output
            }
          : { input: t('modelpricePage.noneGroup'), output: t('modelpricePage.noneGroup') };

        const allGroupPrices = Object.entries(userGroupMap)
          .filter(([key]) => model.groups.includes(key))
          .map(([key, grp]) => ({
            groupName: grp.name,
            groupKey: key,
            input: grp.ratio * model.price.input,
            output: grp.ratio * model.price.output,
            type: model.price.type,
            ratio: grp.ratio,
            extraRatios: model.price.extra_ratios
              ? Object.fromEntries(Object.entries(model.price.extra_ratios).map(([ratioKey, value]) => [ratioKey, (grp.ratio * value).toFixed(6)]))
              : null
          }));

        return {
          model: modelName,
          provider: model.owned_by,
          modelInfo: modelInfoMap[modelName],
          price,
          group: hasAccess ? currentGroup : null,
          type: model.price.type,
          priceData: {
            price: model.price,
            allGroupPrices
          }
        };
      })
      .sort((a, b) => {
        const ownerA = ownedby.find((item) => item.name === a.provider);
        const ownerB = ownedby.find((item) => item.name === b.provider);
        return (ownerA?.id || 0) - (ownerB?.id || 0);
      });
  }, [
    availableModels,
    selectedOwnedBy,
    onlyShowAvailable,
    selectedGroup,
    searchQuery,
    modelInfoMap,
    selectedModality,
    selectedTag,
    userGroupMap,
    ownedby,
    t,
    unit
  ]);

  const paginatedModels = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredModels.slice(startIndex, startIndex + pageSize);
  }, [filteredModels, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [selectedOwnedBy, selectedGroup, searchQuery, selectedModality, selectedTag, onlyShowAvailable, pageSize]);

  useEffect(() => {
    if (!selectedModelDetail?.model) {
      return;
    }

    const matchedModel = filteredModels.find((item) => item.model === selectedModelDetail.model);

    if (!matchedModel) {
      setSelectedModelDetail(null);
      return;
    }

    if (matchedModel !== selectedModelDetail) {
      setSelectedModelDetail(matchedModel);
    }
  }, [filteredModels, selectedModelDetail]);

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / pageSize));
  const pageNumbers = getPageNumbers(page, totalPages);

  const uniqueOwnedBy = [
    'all',
    ...[...new Set(Object.values(availableModels).map((model) => model.owned_by))].sort((a, b) => {
      const ownerA = ownedby.find((item) => item.name === a);
      const ownerB = ownedby.find((item) => item.name === b);
      return (ownerA?.id || 0) - (ownerB?.id || 0);
    })
  ];

  const getIconByName = (name) => {
    if (name === 'all') {
      return null;
    }

    const owner = ownedby.find((item) => item.name === name);
    return owner?.icon;
  };

  const getTags = (tagsJson) => parseJsonArray(tagsJson);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleViewDetail = (modelData) => {
    setSelectedModelDetail(modelData);
  };

  const handleCloseDetail = () => {
    setSelectedModelDetail(null);
  };

  return (
    <div className="public-scope">
      <div className="flex flex-col gap-6 px-1 py-2 sm:px-2">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              {t('modelpricePage.modelPricing')}
            </div>
            <h1 className="mt-4 bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
              {t('modelpricePage.availableModels')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{t('modelpricePage.modelPricing')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
              <button
                type="button"
                title={t('modelpricePage.cardView')}
                onClick={() => setViewMode('card')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid2x2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('modelpricePage.cardView')}</span>
              </button>
              <button
                type="button"
                title={t('modelpricePage.listView')}
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">{t('modelpricePage.listView')}</span>
              </button>
            </div>
          </div>
        </section>

        <section className={cn(surfaceClass, 'p-4 sm:p-5')}>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('modelpricePage.search')}
                className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-12 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="inline-flex w-fit rounded-full border border-border bg-background p-1">
              {unitOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUnit(option.value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    unit === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <FilterChip
              active={onlyShowAvailable}
              onClick={() => setOnlyShowAvailable((prev) => !prev)}
              icon={onlyShowAvailable ? <Check className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
            >
              {onlyShowAvailable ? t('modelpricePage.onlyAvailable') : t('modelpricePage.showAll')}
            </FilterChip>
          </div>

          <div className="mt-5 grid gap-5">
            <div>
              <SectionHeading icon={Globe} title={t('modelpricePage.channelType')} />
              <div className="flex flex-wrap gap-2">
                {uniqueOwnedBy.map((ownedBy) => {
                  const active = selectedOwnedBy === ownedBy;
                  const icon = getIconByName(ownedBy);
                  return (
                    <FilterChip
                      key={ownedBy}
                      active={active}
                      onClick={() => setSelectedOwnedBy(ownedBy)}
                      icon={
                        ownedBy === 'all' ? (
                          <Grid2x2 className="h-4 w-4" />
                        ) : icon ? (
                          <img src={icon} alt={ownedBy} className="h-4 w-4 object-contain" />
                        ) : (
                          <span className="text-xs font-semibold">{ownedBy.charAt(0).toUpperCase()}</span>
                        )
                      }
                    >
                      {ownedBy === 'all' ? t('modelpricePage.all') : ownedBy}
                    </FilterChip>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionHeading icon={Layers3} title={t('modelpricePage.modalityType')} />
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={selectedModality === 'all'}
                  onClick={() => setSelectedModality('all')}
                  icon={<Grid2x2 className="h-4 w-4" />}
                >
                  {t('modelpricePage.allModality')}
                </FilterChip>
                {Object.entries(MODALITY_OPTIONS).map(([key, option]) => (
                  <FilterChip
                    key={key}
                    active={selectedModality === key}
                    onClick={() => setSelectedModality(key)}
                    tone={option.color}
                  >
                    {option.text}
                  </FilterChip>
                ))}
              </div>
            </div>

            {allTags.length > 0 ? (
              <div>
                <SectionHeading icon={Tags} title={t('modelpricePage.tags')} />
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={selectedTag === 'all'}
                    onClick={() => setSelectedTag('all')}
                    icon={<Grid2x2 className="h-4 w-4" />}
                  >
                    {t('modelpricePage.allTags')}
                  </FilterChip>
                  {allTags.map((tag) => (
                    <FilterChip
                      key={tag}
                      active={selectedTag === tag}
                      onClick={() => setSelectedTag(tag)}
                      tone={tag.toLowerCase() === 'hot' ? 'error' : 'info'}
                    >
                      {tag}
                    </FilterChip>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <SectionHeading icon={Users} title={t('modelpricePage.group')} />
              <div className="flex flex-wrap gap-2">
                {Object.entries(userGroupMap).map(([key, group]) => {
                  const active = selectedGroup === key;
                  const ratioTone = group.ratio > 1 ? 'warning' : group.ratio > 0 ? 'info' : 'success';
                  return (
                    <FilterChip
                      key={key}
                      active={active}
                      onClick={() => setSelectedGroup(key)}
                      icon={active ? <Check className="h-4 w-4" /> : null}
                    >
                      <span>{group.name}</span>
                      <span
                        className={cn(
                          'inline-flex min-w-8 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                          filterToneMap[ratioTone]
                        )}
                      >
                        {group.ratio > 0 ? `x${group.ratio}` : t('modelpricePage.free')}
                      </span>
                    </FilterChip>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {t('modelpricePage.totalModels', { count: filteredModels.length })}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground" htmlFor="price-page-size">
              {t('modelpricePage.pageSize')}
            </label>
            <select
              id="price-page-size"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="h-10 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </section>

        {filteredModels.length > 0 ? (
          <>
            {viewMode === 'card' ? (
              <section className="flex flex-wrap gap-4">
                {paginatedModels.map((model) => (
                  <div
                    key={model.model}
                    className="w-full sm:flex-none sm:w-[calc((100%_-_1rem)/2)] sm:max-w-[calc((100%_-_1rem)/2)] lg:w-[calc((100%_-_2rem)/3)] lg:max-w-[calc((100%_-_2rem)/3)] xl:w-[calc((100%_-_4rem)/5)] xl:max-w-[calc((100%_-_4rem)/5)]"
                  >
                    <ModelCard
                      model={model.model}
                      provider={model.provider}
                      modelInfo={model.modelInfo}
                      price={model.price}
                      group={model.group}
                      ownedbyIcon={getIconByName(model.provider)}
                      unit={unit}
                      type={model.type}
                      formatPrice={formatPrice}
                      onViewDetail={() => handleViewDetail(model)}
                    />
                  </div>
                ))}
              </section>
            ) : (
              <section className={cn(surfaceClass, 'overflow-hidden')}>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-background/70">
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-4 text-sm font-semibold text-foreground">{t('modelpricePage.modelName')}</th>
                        <th className="px-4 py-4 text-sm font-semibold text-foreground">{t('modelpricePage.type')}</th>
                        <th className="px-4 py-4 text-sm font-semibold text-foreground">{t('modelpricePage.provider')}</th>
                        <th className="px-4 py-4 text-sm font-semibold text-foreground">{t('modelpricePage.inputPrice')}</th>
                        <th className="px-4 py-4 text-sm font-semibold text-foreground">{t('modelpricePage.outputPrice')}</th>
                        <th className="px-4 py-4 text-sm font-semibold text-foreground">{t('common.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedModels.map((model) => (
                        <tr key={model.model} className="border-b border-border/70 bg-card/80 align-top last:border-b-0">
                          <td className="px-4 py-4">
                            <div className="flex min-w-[240px] flex-col gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">{model.modelInfo?.name || model.model}</span>
                                <button
                                  type="button"
                                  onClick={() => copy(model.model, t('modelpricePage.modelName'))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                {getTags(model.modelInfo?.tags).some((tag) => tag.toLowerCase() === 'hot') ? (
                                  <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                                    HOT
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {getTags(model.modelInfo?.tags)
                                  .filter((tag) => tag.toLowerCase() !== 'hot')
                                  .map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                                model.type === 'times'
                                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                  : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              )}
                            >
                              {model.type === 'tokens' ? t('modelpricePage.tokens') : t('modelpricePage.times')}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex min-w-[140px] items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                                {getIconByName(model.provider) ? (
                                  <img src={getIconByName(model.provider)} alt={model.provider} className="h-5 w-5 object-contain" />
                                ) : (
                                  <span className="text-xs font-semibold text-foreground">{model.provider?.charAt(0)?.toUpperCase()}</span>
                                )}
                              </div>
                              <span className="text-sm text-foreground">{model.provider}</span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="min-w-[180px] space-y-2">
                              {model.priceData.allGroupPrices.map((groupPrice) => (
                                <div key={groupPrice.groupKey} className="flex items-center gap-2 text-sm">
                                  <span className="min-w-[44px] text-xs text-muted-foreground">{groupPrice.groupName}</span>
                                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                    {groupPrice.input > 0 ? formatPrice(groupPrice.input, model.type === 'tokens' ? 'tokens' : 'times') : t('modelpricePage.free')}
                                  </span>
                                  {groupPrice.input > 0 ? <span className="text-xs text-muted-foreground">(x{groupPrice.ratio})</span> : null}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="min-w-[180px] space-y-2">
                              {model.priceData.allGroupPrices.map((groupPrice) => (
                                <div key={groupPrice.groupKey} className="flex items-center gap-2 text-sm">
                                  <span className="min-w-[44px] text-xs text-muted-foreground">{groupPrice.groupName}</span>
                                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                                    {groupPrice.output > 0 ? formatPrice(groupPrice.output, model.type === 'tokens' ? 'tokens' : 'times') : t('modelpricePage.free')}
                                  </span>
                                  {groupPrice.output > 0 ? <span className="text-xs text-muted-foreground">(x{groupPrice.ratio})</span> : null}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <button
                              type="button"
                              onClick={() => handleViewDetail(model)}
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <Eye className="h-4 w-4" />
                              {t('modelpricePage.viewDetail')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((current) => Math.max(1, current - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('modelpricePage.previous')}
                </button>

                {pageNumbers.map((item) =>
                  String(item).startsWith('ellipsis') ? (
                    <span key={item} className="px-2 text-sm text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setPage(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={cn(
                        'inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors',
                        page === item
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((current) => Math.min(totalPages, current + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('modelpricePage.next')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className={cn(surfaceClass, 'p-10 text-center sm:p-14')}>
            <div className="mx-auto flex max-w-md flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-border bg-background text-muted-foreground">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-foreground">{t('modelpricePage.noModelsFound')}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('modelpricePage.noModelsFoundTip')}</p>
            </div>
          </section>
        )}

        <ModelDetailPanel
          open={Boolean(selectedModelDetail)}
          model={selectedModelDetail?.model}
          provider={selectedModelDetail?.provider}
          modelInfo={selectedModelDetail?.modelInfo}
          priceData={selectedModelDetail?.priceData}
          ownedbyIcon={selectedModelDetail ? getIconByName(selectedModelDetail.provider) : null}
          formatPrice={formatPrice}
          onClose={handleCloseDetail}
        />

      </div>
    </div>
  );
}
