import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Paper,
  Stack,
  Dialog,
  Button,
  Checkbox,
  Collapse,
  Typography,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { API } from 'utils/api';
import { showError, showInfo, showSuccess } from 'utils/common';

import { Icon } from '@iconify/react';

export function ChannelCheck({ item, open, onClose }) {
  const [providerModelsLoad, setProviderModelsLoad] = useState(false);
  const [modelList, setModelList] = useState([]);
  const [checkLoad, setCheckLoad] = useState(false);
  const [selectedModels, setSelectedModels] = useState([]);
  const [checkResults, setCheckResults] = useState([]);
  const [expandedResponses, setExpandedResponses] = useState({});
  const [expandedModels, setExpandedModels] = useState({});
  const [runningModels, setRunningModels] = useState([]);

  const normalizeModelList = (models) => {
    if (!models) {
      return [];
    }

    if (typeof models === 'string') {
      return models
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean);
    }

    if (Array.isArray(models)) {
      return models
        .map((model) => {
          if (typeof model === 'string') {
            return model.trim();
          }
          return model?.id?.trim?.() || '';
        })
        .filter(Boolean);
    }

    return [];
  };

  const formatDuration = (durationMs) => {
    if (!durationMs || durationMs <= 0) {
      return '-';
    }

    if (durationMs < 1000) {
      return `${durationMs.toFixed(0)} ms`;
    }

    return `${(durationMs / 1000).toFixed(2)} s`;
  };

  useEffect(() => {
    if (open && item?.models) {
      const initialModels = normalizeModelList(item.models);
      setModelList(initialModels);
      setSelectedModels(initialModels);
      setCheckResults([]);
      setExpandedResponses({});
      setExpandedModels({});
      setRunningModels([]);
    }
  }, [item?.models, open]);

  const handleSelectAll = () => {
    setSelectedModels(modelList);
  };

  const handleUnselectAll = () => {
    setSelectedModels([]);
  };

  const handleModelToggle = (model) => {
    setSelectedModels((prev) => (prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]));
  };

  const getProviderModels = async (values) => {
    setProviderModelsLoad(true);
    try {
      const res = await API.post(`/api/channel/provider_models_list`, {
        ...values,
        models: '',
        model_mapping: ''
      });
      const { success, message, data } = res.data;
      if (success && data) {
        const filteredModels = data.filter((model) => {
          if (model.startsWith('gpt-') || model.startsWith('chatgpt-')) {
            return !model.includes('-all') && !model.includes('-realtime') && !model.includes('-instruct');
          }
          if (model.startsWith('gemini-')) {
            return true;
          }
          if (model.startsWith('claude-')) {
            return true;
          }
          return false;
        });

        const uniqueModels = [...new Set(filteredModels)];
        setModelList(uniqueModels);
        setSelectedModels((prev) => prev.filter((model) => uniqueModels.includes(model)));
      } else {
        showError(message || '获取模型失败');
      }
    } catch (error) {
      showError(error.message);
    }
    setProviderModelsLoad(false);
  };

  const getResultByModel = (model) => checkResults.find((result) => result.model === model);

  const runCheck = async (modelsToCheck, replaceAll = false) => {
    if (!item?.id) {
      showError('请先保存渠道后再测试模型');
      return;
    }

    if (!modelsToCheck.length) {
      return;
    }

    const latestResults = new Map();
    if (replaceAll) {
      setCheckLoad(true);
      setCheckResults([]);
    } else {
      setCheckResults((prev) => prev.filter((result) => !modelsToCheck.includes(result.model)));
    }

    try {
      for (const model of modelsToCheck) {
        setRunningModels([model]);

        try {
          const response = await API.get(`/api/channel/test/${item.id}`, {
            params: {
              model
            }
          });

          const { success, message, time } = response.data;
          const result = {
            model,
            duration_ms: (time || 0) * 1000,
            process: [
              {
                name: '测速结果',
                results: [
                  {
                    name: '响应',
                    status: success ? 1 : 0,
                    remark: message || (success ? '测速成功' : '测速失败')
                  }
                ],
                response: response.data
              }
            ]
          };

          latestResults.set(model, result);
          setCheckResults((prev) => {
            const existingIndex = prev.findIndex((item2) => item2.model === model);

            if (existingIndex !== -1) {
              const newResults = [...prev];
              newResults[existingIndex] = result;
              return newResults;
            }

            return [...prev, result];
          });
        } catch (error) {
          const result = {
            model,
            duration_ms: 0,
            process: [
              {
                name: '测速结果',
                results: [
                  {
                    name: '响应',
                    status: 0,
                    remark: error.message || '测速失败'
                  }
                ],
                response: null
              }
            ]
          };

          latestResults.set(model, result);
          setCheckResults((prev) => {
            const existingIndex = prev.findIndex((item2) => item2.model === model);

            if (existingIndex !== -1) {
              const newResults = [...prev];
              newResults[existingIndex] = result;
              return newResults;
            }

            return [...prev, result];
          });
        }
      }

      if (modelsToCheck.length === 1) {
        const model = modelsToCheck[0];
        const result = latestResults.get(model);
        if (result) {
          const status = getModelStatus(result);
          const duration = formatDuration(result.duration_ms);
          if (status.success) {
            showSuccess(`${model} 测试成功，耗时 ${duration}`);
          } else {
            showError(`${model} 测试失败，耗时 ${duration}`);
          }
        }
      } else if (replaceAll) {
        const results = modelsToCheck.map((model) => latestResults.get(model)).filter(Boolean);
        const successCount = results.filter((result) => getModelStatus(result).success).length;
        const failedCount = results.length - successCount;
        showInfo(`模型测试完成：成功 ${successCount}，失败 ${failedCount}`);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setRunningModels([]);
      setCheckLoad(false);
    }
  };

  const handleCheck = async () => {
    await runCheck(selectedModels, true);
  };

  const toggleResponse = (modelIndex, processIndex) => {
    const key = `${modelIndex}-${processIndex}`;
    setExpandedResponses((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getModelStatus = (result) => {
    const hasFailure = result.process.some((process) => process.results.some((item2) => item2.status !== 1));
    return {
      success: !hasFailure,
      icon: hasFailure ? 'solar:danger-circle-bold' : 'solar:check-circle-bold',
      color: hasFailure ? '#FF4842' : '#54D62C',
      text: hasFailure ? '检测异常' : '检测通过'
    };
  };

  const toggleModel = (modelIndex) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelIndex]: !prev[modelIndex]
    }));
  };

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxWidth: 800,
          borderRadius: 2,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 3,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          模型渠道检测
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={() => getProviderModels(item)}
              disabled={providerModelsLoad || runningModels.length > 0}
              startIcon={<Icon icon="solar:refresh-bold" />}
            >
              获取可用模型
            </Button>
            <Button onClick={handleSelectAll} startIcon={<Icon icon="solar:check-square-bold" />} disabled={runningModels.length > 0}>
              全选
            </Button>
            <Button onClick={handleUnselectAll} startIcon={<Icon icon="solar:square-bold" />} disabled={runningModels.length > 0}>
              反选
            </Button>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50')
            }}
          >
            <Stack spacing={1.5}>
              {modelList.map((model) => {
                const hasResult = checkResults.some((result) => result.model === model);
                const isRunning = runningModels.includes(model);
                const result = getResultByModel(model);
                const status = result ? getModelStatus(result) : null;

                return (
                  <Stack
                    key={model}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'background.paper')
                    }}
                  >
                    <FormControlLabel
                      sx={{ m: 0, flex: 1 }}
                      control={
                        <Checkbox
                          checked={selectedModels.includes(model)}
                          onChange={() => handleModelToggle(model)}
                          disabled={runningModels.length > 0}
                        />
                      }
                      label={model}
                    />
                    <Tooltip title={!item?.id ? '请先保存渠道后再测试模型' : ''}>
                      <span>
                        <LoadingButton
                          size="small"
                          variant={hasResult ? 'outlined' : 'contained'}
                          loading={isRunning}
                          disabled={!item?.id || runningModels.length > 0}
                          onClick={() => runCheck([model])}
                        >
                          测试
                        </LoadingButton>
                      </span>
                    </Tooltip>
                    {status && (
                      <Box
                        sx={{
                          minWidth: 132,
                          py: 0.5,
                          px: 1.25,
                          borderRadius: 1,
                          bgcolor: () => alpha(status.color, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 0.75
                        }}
                      >
                        <Icon icon={status.icon} width={16} sx={{ color: status.color }} />
                        <Typography variant="caption" sx={{ color: status.color, fontWeight: 600 }}>
                          {status.success ? '成功' : '失败'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDuration(result.duration_ms)}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Paper>

          <LoadingButton
            fullWidth
            variant="contained"
            onClick={handleCheck}
            loading={checkLoad}
            disabled={selectedModels.length === 0 || runningModels.length > 0}
            sx={{ height: 48 }}
          >
            开始检测
          </LoadingButton>

          <Stack spacing={2}>
            {checkResults.map((result, modelIndex) => (
              <Paper
                key={modelIndex}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50')
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2} onClick={() => toggleModel(modelIndex)} sx={{ cursor: 'pointer' }}>
                  <Icon icon={expandedModels[modelIndex] ? 'solar:arrow-down-bold' : 'solar:arrow-right-bold'} />
                  <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 500 }}>
                    {result.model}
                  </Typography>

                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    耗时 {formatDuration(result.duration_ms)}
                  </Typography>

                  <Box
                    sx={{
                      py: 0.5,
                      px: 1.5,
                      borderRadius: 1,
                      bgcolor: () => alpha(getModelStatus(result).color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Icon icon={getModelStatus(result).icon} width={16} sx={{ color: getModelStatus(result).color }} />
                    <Typography variant="caption" sx={{ color: getModelStatus(result).color, fontWeight: 500 }}>
                      {getModelStatus(result).text}
                    </Typography>
                  </Box>
                </Stack>

                <Collapse in={expandedModels[modelIndex]}>
                  <Box sx={{ mt: 2 }}>
                    {result.process.map((process, processIndex) => (
                      <Box key={processIndex} sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1,
                            color: 'primary.main',
                            fontWeight: 500
                          }}
                        >
                          {process.name}
                        </Typography>

                        <Stack spacing={1} sx={{ mb: 1 }}>
                          {process.results.map((item2, rIndex) => (
                            <Paper
                              key={rIndex}
                              variant="outlined"
                              sx={{
                                p: 1,
                                borderColor: item2.status === 1 ? 'success.light' : 'error.light',
                                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'background.paper')
                              }}
                            >
                              <Stack direction="row" alignItems="flex-start" spacing={1}>
                                <Icon
                                  icon={item2.status === 1 ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                                  width={20}
                                  sx={{
                                    color: item2.status === 1 ? 'success.main' : 'error.main',
                                    mt: 0.25
                                  }}
                                />
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                    {item2.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      color: 'text.secondary'
                                    }}
                                  >
                                    {item2.remark}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>

                        <Button
                          size="small"
                          onClick={() => toggleResponse(modelIndex, processIndex)}
                          endIcon={
                            <Icon
                              icon={expandedResponses[`${modelIndex}-${processIndex}`] ? 'solar:arrow-up-bold' : 'solar:arrow-down-bold'}
                            />
                          }
                        >
                          Response 详情
                        </Button>

                        <Collapse in={expandedResponses[`${modelIndex}-${processIndex}`]}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              mt: 1,
                              borderRadius: 1,
                              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'grey.50')
                            }}
                          >
                            <pre
                              style={{
                                margin: 0,
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.875rem'
                              }}
                            >
                              {JSON.stringify(process.response, null, 2)}
                            </pre>
                          </Paper>
                        </Collapse>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </Paper>
            ))}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

ChannelCheck.propTypes = {
  item: PropTypes.object,
  open: PropTypes.bool,
  onClose: PropTypes.func
};
