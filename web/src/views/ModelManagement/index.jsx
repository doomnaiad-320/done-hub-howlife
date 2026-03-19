import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TablePagination,
  Tooltip,
  Toolbar,
  Typography,
  useTheme
} from '@mui/material';
import { Icon } from '@iconify/react';
import { alpha } from '@mui/material/styles';
import AdminContainer from 'ui-component/AdminContainer';
import { API } from 'utils/api';
import { copy, showError, showSuccess, trims, useIsAdmin, ValueFormatter } from 'utils/common';
import PricingEditModal from 'views/Pricing/component/EditModal';
import ModelInfoEditModal from 'views/ModelInfo/component/EditModal';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'missing_any', label: '待完善' },
  { value: 'missing_price', label: '缺价格' },
  { value: 'missing_info', label: '缺详情' },
  { value: 'ready', label: '已完成' }
];

const PRICE_TEMPLATE = {
  model: '',
  type: 'tokens',
  channel_type: 1,
  input: 0,
  output: 0,
  locked: false,
  extra_ratios: {}
};

const formatPricePreview = (price) => {
  if (!price) {
    return '-';
  }

  if (price.type === 'times') {
    return `${ValueFormatter(price.input, true)} / 次`;
  }

  return `${ValueFormatter(price.input, true, true)} / ${ValueFormatter(price.output, true, true)}`;
};

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const getCompletionStatus = (row) => {
  if (row.hasPrice && row.hasInfo) {
    return { label: '已完善', color: 'success' };
  }

  if (!row.hasPrice && !row.hasInfo) {
    return { label: '待补全', color: 'warning' };
  }

  if (!row.hasPrice) {
    return { label: '缺价格', color: 'warning' };
  }

  return { label: '缺详情', color: 'info' };
};

const getCompletionRank = (row) => {
  if (!row.hasPrice && !row.hasInfo) {
    return 0;
  }

  if (!row.hasPrice || !row.hasInfo) {
    return 1;
  }

  return 2;
};

export default function ModelManagement() {
  const navigate = useNavigate();
  const userIsAdmin = useIsAdmin();
  const theme = useTheme();

  const [availableModels, setAvailableModels] = useState({});
  const [prices, setPrices] = useState([]);
  const [modelInfos, setModelInfos] = useState([]);
  const [ownedby, setOwnedby] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [loading, setLoading] = useState(false);

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [priceModalItem, setPriceModalItem] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalItem, setInfoModalItem] = useState(null);

  useEffect(() => {
    if (!userIsAdmin) {
      navigate('/panel/404');
    }
  }, [navigate, userIsAdmin]);

  const fetchOwnedby = useCallback(async () => {
    const res = await API.get('/api/ownedby');
    const { success, message, data } = res.data;
    if (!success) {
      throw new Error(message);
    }

    const ownedbyList = [];
    for (const key in data) {
      ownedbyList.push({
        value: parseInt(key, 10),
        label: data[key]?.name || '',
        name: data[key]?.name || ''
      });
    }
    setOwnedby(ownedbyList);
  }, []);

  const fetchAvailableModels = useCallback(async () => {
    const res = await API.get('/api/available_model');
    const { success, message, data } = res.data;
    if (!success) {
      throw new Error(message);
    }
    setAvailableModels(data || {});
  }, []);

  const fetchPrices = useCallback(async () => {
    const res = await API.get('/api/prices');
    const { success, message, data } = res.data;
    if (!success) {
      throw new Error(message);
    }
    setPrices(Array.isArray(data) ? data : []);
  }, []);

  const fetchModelInfos = useCallback(async () => {
    const res = await API.get('/api/model_info/');
    const { success, message, data } = res.data;
    if (!success) {
      throw new Error(message);
    }
    setModelInfos(Array.isArray(data) ? data : []);
  }, []);

  const reloadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchOwnedby(), fetchAvailableModels(), fetchPrices(), fetchModelInfos()]);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchAvailableModels, fetchModelInfos, fetchOwnedby, fetchPrices]);

  useEffect(() => {
    if (userIsAdmin) {
      reloadData();
    }
  }, [reloadData, userIsAdmin]);

  const channelModelList = useMemo(() => {
    return Object.keys(availableModels).sort((a, b) => a.localeCompare(b));
  }, [availableModels]);

  const priceMap = useMemo(() => new Map(prices.map((price) => [price.model, price])), [prices]);
  const modelInfoMap = useMemo(() => new Map(modelInfos.map((info) => [info.model, info])), [modelInfos]);

  const modelRows = useMemo(() => {
    const rowMap = new Map();

    Object.entries(availableModels).forEach(([modelName, model]) => {
      if (!rowMap.has(modelName)) {
        rowMap.set(modelName, {
          model: modelName,
          providers: new Set(),
          groups: new Set(),
          fromChannel: true,
          price: priceMap.get(modelName) || null,
          modelInfo: modelInfoMap.get(modelName) || null
        });
      }
      const row = rowMap.get(modelName);
      row.fromChannel = true;
      if (model.owned_by) {
        row.providers.add(model.owned_by);
      }
      if (Array.isArray(model.groups)) {
        model.groups.forEach((group) => {
          if (group) {
            row.groups.add(group);
          }
        });
      }
    });

    return Array.from(rowMap.values())
      .map((row) => {
        const tagList = parseJsonArray(row.modelInfo?.tags);
        return {
          ...row,
          providers: Array.from(row.providers).sort(),
          groups: Array.from(row.groups).sort(),
          hasPrice: !!row.price,
          hasInfo: !!row.modelInfo,
          displayName: row.modelInfo?.name || row.model,
          description: row.modelInfo?.description || '',
          tagList
        };
      })
      .sort((a, b) => {
        const rankDiff = getCompletionRank(a) - getCompletionRank(b);
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return a.model.localeCompare(b.model);
      });
  }, [availableModels, modelInfoMap, priceMap]);

  const noPriceModels = useMemo(() => {
    return channelModelList.filter((model) => !prices.some((price) => price.model === model));
  }, [channelModelList, prices]);

  const providerOptions = useMemo(() => ['all', ...new Set(modelRows.flatMap((row) => row.providers))], [modelRows]);

  const filteredRows = useMemo(() => {
    const lowerKeyword = keyword.trim().toLowerCase();

    return modelRows.filter((row) => {
      if (providerFilter !== 'all' && !row.providers.includes(providerFilter)) {
        return false;
      }

      if (statusFilter === 'missing_any' && row.hasPrice && row.hasInfo) {
        return false;
      }
      if (statusFilter === 'missing_price' && row.hasPrice) {
        return false;
      }
      if (statusFilter === 'missing_info' && row.hasInfo) {
        return false;
      }
      if (statusFilter === 'ready' && (!row.hasPrice || !row.hasInfo)) {
        return false;
      }

      if (!lowerKeyword) {
        return true;
      }

      const providerText = row.providers.join(' ').toLowerCase();
      const infoText = `${row.displayName} ${row.description}`.toLowerCase();
      const tagsText = row.tagList.join(' ').toLowerCase();

      return (
        row.model.toLowerCase().includes(lowerKeyword) ||
        providerText.includes(lowerKeyword) ||
        infoText.includes(lowerKeyword) ||
        tagsText.includes(lowerKeyword)
      );
    });
  }, [keyword, modelRows, providerFilter, statusFilter]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const summary = useMemo(() => {
    return {
      total: modelRows.length,
      missingPrice: noPriceModels.length,
      missingInfo: modelRows.filter((row) => !row.hasInfo).length
    };
  }, [modelRows, noPriceModels]);

  useEffect(() => {
    setPage(0);
  }, [keyword, providerFilter, statusFilter]);

  const handleRefresh = () => {
    reloadData();
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenPriceModal = (row) => {
    const matchedOwnedby = ownedby.find((item) => row.providers.includes(item.name) || row.providers.includes(item.label));
    const channelType = row.price?.channel_type > 0 ? row.price.channel_type : matchedOwnedby?.value || ownedby[0]?.value || 1;

    setPriceModalItem({
      row,
      price: row.price
        ? {
            ...row.price,
            extra_ratios: row.price.extra_ratios || {}
          }
        : {
            ...PRICE_TEMPLATE,
            model: row.model,
            channel_type: channelType
          }
    });
    setPriceModalOpen(true);
  };

  const handleClosePriceModal = () => {
    setPriceModalOpen(false);
    setPriceModalItem(null);
  };

  const handleSavePrice = async (formData) => {
    const payload = trims(formData);
    let res;

    if (priceModalItem?.row?.price) {
      const modelEncode = encodeURIComponent(priceModalItem.row.model);
      res = await API.put(`/api/prices/single/${modelEncode}`, payload);
    } else {
      res = await API.post('/api/prices/single', payload);
    }

    const { success, message } = res.data;
    if (!success) {
      throw new Error(message);
    }

    showSuccess('价格保存成功');
    handleClosePriceModal();
    await reloadData();
  };

  const handleOpenInfoModal = (row) => {
    setInfoModalItem({
      editId: row.modelInfo?.id || 0,
      initialValues: row.modelInfo
        ? null
        : {
            model: row.model,
            name: row.model
          }
    });
    setInfoModalOpen(true);
  };

  const handleCloseInfoModal = () => {
    setInfoModalOpen(false);
    setInfoModalItem(null);
  };

  const handleInfoModalOk = async (status) => {
    if (status === true) {
      handleCloseInfoModal();
      await reloadData();
    }
  };

  if (!userIsAdmin) {
    return null;
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2}>
        <Stack direction="column" spacing={1}>
          <Typography variant="h2">模型管理</Typography>
        </Stack>

        <ButtonGroup variant="contained">
          <Button onClick={handleRefresh} startIcon={<Icon icon="solar:refresh-circle-bold-duotone" />}>
            刷新
          </Button>
          <Button variant="outlined" onClick={() => navigate('/panel/pricing')} startIcon={<Icon icon="solar:document-bold-duotone" />}>
            价格总表
          </Button>
          <Button variant="outlined" onClick={() => navigate('/panel/model_info')} startIcon={<Icon icon="solar:info-circle-bold-duotone" />}>
            详情总表
          </Button>
        </ButtonGroup>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {[
          { label: '模型总数', value: summary.total, color: theme.palette.primary.main, bg: alpha(theme.palette.primary.main, 0.08) },
          { label: '缺价格', value: summary.missingPrice, color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.12) },
          { label: '缺详情', value: summary.missingInfo, color: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.12) }
        ].map((item) => (
          <Card
            key={item.label}
            variant="outlined"
            sx={{
              flex: 1,
              minWidth: 0,
              px: 2.5,
              py: 2,
              borderRadius: 3,
              bgcolor: item.bg,
              borderColor: alpha(item.color, 0.2)
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="h3" sx={{ mt: 0.5, color: item.color }}>
              {item.value}
            </Typography>
          </Card>
        ))}
      </Stack>

      <Alert severity={summary.missingPrice > 0 || summary.missingInfo > 0 ? 'warning' : 'success'} sx={{ borderRadius: 2.5 }}>
        共 {summary.total} 个模型，缺价格 {summary.missingPrice} 个，缺详情 {summary.missingInfo} 个。
      </Alert>

      {noPriceModels.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: 2.5 }}>
          <b>存在未配置价格的模型，请及时配置价格</b>：{noPriceModels.join('，')}
        </Alert>
      )}

      <Card sx={{ overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <AdminContainer>
          <Toolbar
            sx={{
              minHeight: 88,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
              p: (innerTheme) => innerTheme.spacing(2, 0)
            }}
          >
            <OutlinedInput
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索模型、说明、标签或供应商..."
              startAdornment={<Icon icon="eva:search-fill" style={{ width: 20, height: 20, marginRight: 8 }} />}
              sx={{
                minWidth: { xs: '100%', md: 360 },
                bgcolor: alpha(theme.palette.background.default, 0.7),
                borderRadius: 2.5
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>供应商</InputLabel>
                <Select value={providerFilter} label="供应商" onChange={(event) => setProviderFilter(event.target.value)}>
                  {providerOptions.map((provider) => (
                    <MenuItem key={provider} value={provider}>
                      {provider === 'all' ? '全部' : provider}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>状态</InputLabel>
                <Select value={statusFilter} label="状态" onChange={(event) => setStatusFilter(event.target.value)}>
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Toolbar>

          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              当前筛选结果 {filteredRows.length} / 全部模型 {summary.total}
            </Typography>

            {paginatedRows.length > 0 ? (
              <Grid container spacing={2.5}>
                {paginatedRows.map((row) => {
                  const status = getCompletionStatus(row);
                  const statusColor = theme.palette[status.color].main;
                  const isTimesBilling = row.price?.type === 'times';
                  const infoContext = row.hasInfo
                    ? `Ctx ${Number(row.modelInfo.context_length || 0).toLocaleString()} / Max ${Number(row.modelInfo.max_tokens || 0).toLocaleString()}`
                    : '详情未配置';
                  const visibleProviders = row.providers.slice(0, 2);
                  const extraProviderCount = row.providers.length - visibleProviders.length;
                  const visibleGroups = row.groups.slice(0, 2);
                  const extraGroupCount = row.groups.length - visibleGroups.length;
                  const visibleTags = row.tagList.slice(0, 2);
                  const extraTagCount = row.tagList.length - visibleTags.length;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={row.model}>
                      <Card
                        variant="outlined"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          p: 1.5,
                          borderRadius: 2.5,
                          borderColor: alpha(statusColor, 0.25),
                          boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.04)}`,
                          transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            borderColor: alpha(statusColor, 0.42),
                            boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.08)}`
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
                              <Tooltip title={row.displayName}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 700,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {row.displayName}
                                </Typography>
                              </Tooltip>
                              <Chip
                                size="small"
                                color={status.color}
                                label={status.label}
                                sx={
                                  status.label === '缺详情'
                                    ? {
                                        bgcolor: theme.palette.warning.light,
                                        color: theme.palette.common.black,
                                        fontWeight: 700
                                      }
                                    : undefined
                                }
                              />
                            </Stack>

                            <Tooltip title={row.model}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  mt: 0.5,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-all',
                                  lineHeight: 1.5,
                                  minHeight: 34
                                }}
                              >
                                {row.model}
                              </Typography>
                            </Tooltip>
                          </Box>

                          <Stack direction="row" spacing={0.5}>
                            {row.description && (
                              <Tooltip title={row.description}>
                                <IconButton size="small">
                                  <Icon icon="solar:info-circle-linear" width={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="复制模型标识">
                              <IconButton size="small" onClick={() => copy(row.model, '模型标识')}>
                                <Icon icon="eva:copy-outline" width={16} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mt: 1.25, minHeight: 24 }}>
                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ minWidth: 0, flex: 1 }}>
                            {visibleProviders.length > 0 ? (
                              visibleProviders.map((provider) => (
                                <Chip
                                  key={provider}
                                  size="small"
                                  label={provider}
                                  sx={{
                                    maxWidth: 140,
                                    borderRadius: 1.5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    color: theme.palette.primary.dark,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    '& .MuiChip-label': {
                                      px: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }
                                  }}
                                />
                              ))
                            ) : (
                              <Chip size="small" variant="outlined" label="未识别供应商" />
                            )}
                            {extraProviderCount > 0 && <Chip size="small" variant="outlined" label={`+${extraProviderCount}`} />}
                            {visibleGroups.map((group) => (
                              <Chip key={group} size="small" variant="outlined" color="secondary" label={group} />
                            ))}
                            {extraGroupCount > 0 && <Chip size="small" variant="outlined" color="secondary" label={`+${extraGroupCount}`} />}
                            {row.fromChannel && row.groups.length === 0 && <Chip size="small" variant="outlined" color="primary" label="已接入" />}
                          </Stack>

                          {row.hasPrice && (
                            <Chip
                              size="small"
                              color={isTimesBilling ? 'secondary' : 'success'}
                              label={isTimesBilling ? '次计费' : 'Token'}
                              sx={{ flexShrink: 0 }}
                            />
                          )}
                        </Stack>

                        <Stack spacing={1} sx={{ mt: 1.25, flex: 1 }}>
                          <Box
                            sx={{
                              px: 1.1,
                              py: 0.9,
                              borderRadius: 2,
                              bgcolor: row.hasPrice
                                ? alpha(isTimesBilling ? theme.palette.secondary.main : theme.palette.success.main, 0.12)
                                : alpha(theme.palette.warning.main, 0.08),
                              border: `1px solid ${
                                row.hasPrice
                                  ? alpha(isTimesBilling ? theme.palette.secondary.main : theme.palette.success.main, 0.2)
                                  : alpha(theme.palette.warning.main, 0.12)
                              }`
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                              <Typography variant="caption" color="text.secondary">
                                价格
                              </Typography>
                              <Chip size="small" color={row.hasPrice ? 'success' : 'warning'} label={row.hasPrice ? '已配' : '未配'} />
                            </Stack>
                            <Tooltip title={row.hasPrice ? formatPricePreview(row.price) : '尚未建立价格记录'}>
                              <Typography
                                variant="caption"
                                sx={{
                                  mt: 0.75,
                                  display: 'block',
                                  lineHeight: 1.5,
                                  color: row.hasPrice ? 'text.primary' : 'text.secondary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {row.hasPrice ? formatPricePreview(row.price) : '尚未建立价格记录'}
                              </Typography>
                            </Tooltip>
                          </Box>

                          <Box
                            sx={{
                              px: 1.1,
                              py: 0.9,
                              borderRadius: 2,
                              bgcolor: alpha(row.hasInfo ? theme.palette.info.main : theme.palette.warning.main, 0.08)
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                              <Typography variant="caption" color="text.secondary">
                                详情
                              </Typography>
                              <Chip size="small" color={row.hasInfo ? 'info' : 'warning'} label={row.hasInfo ? '已配' : '未配'} />
                            </Stack>
                            <Tooltip title={row.hasInfo ? infoContext : '尚未建立模型详情'}>
                              <Typography
                                variant="caption"
                                sx={{
                                  mt: 0.75,
                                  display: 'block',
                                  lineHeight: 1.5,
                                  color: row.hasInfo ? 'text.primary' : 'text.secondary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {infoContext}
                              </Typography>
                            </Tooltip>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.25, minHeight: 24 }}>
                          {visibleTags.map((tag) => (
                            <Chip key={tag} size="small" variant="outlined" label={tag} />
                          ))}
                          {extraTagCount > 0 && <Chip size="small" variant="outlined" label={`+${extraTagCount}`} />}
                        </Stack>

                        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                          <Button
                            size="small"
                            fullWidth
                            variant={row.hasPrice ? 'outlined' : 'contained'}
                            color={row.hasPrice ? 'primary' : 'warning'}
                            onClick={() => handleOpenPriceModal(row)}
                          >
                            {row.hasPrice ? '价格' : '补价格'}
                          </Button>
                          <Button
                            size="small"
                            fullWidth
                            variant={row.hasInfo ? 'outlined' : 'contained'}
                            color={row.hasInfo ? 'primary' : 'warning'}
                            onClick={() => handleOpenInfoModal(row)}
                          >
                            {row.hasInfo ? '详情' : '补详情'}
                          </Button>
                        </Stack>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Card
                variant="outlined"
                sx={{
                  py: 8,
                  borderRadius: 3,
                  borderStyle: 'dashed'
                }}
              >
                <Stack spacing={1} alignItems="center">
                  <Icon icon="solar:box-minimalistic-line-duotone" width={28} />
                  <Typography variant="body2" color="text.secondary">
                    没有匹配的模型
                  </Typography>
                </Stack>
              </Card>
            )}
          </Stack>

          <TablePagination
            page={page}
            component="div"
            count={filteredRows.length}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            rowsPerPageOptions={[12, 30, 60, 120]}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </AdminContainer>
      </Card>

      <PricingEditModal
        open={priceModalOpen}
        onCancel={handleClosePriceModal}
        onOk={() => {}}
        ownedby={ownedby}
        noPriceModel={[]}
        singleMode
        price={priceModalItem?.price || PRICE_TEMPLATE}
        rows={prices}
        onSaveSingle={handleSavePrice}
        unit="M"
      />

      <ModelInfoEditModal
        open={infoModalOpen}
        onCancel={handleCloseInfoModal}
        onOk={handleInfoModalOk}
        editId={infoModalItem?.editId || 0}
        existingModels={modelInfos.map((info) => info.model)}
        initialValues={infoModalItem?.initialValues || null}
      />
    </Stack>
  );
}
