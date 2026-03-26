import PropTypes from 'prop-types';
import { Card, Typography, Box, Avatar, Stack, IconButton, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import Label from 'ui-component/Label';
import { MODALITY_OPTIONS } from 'constants/Modality';
import { copy } from 'utils/common';
import { useTranslation } from 'react-i18next';
import { inferApiEndpoints, parseJsonArray } from './modelEndpointUtils';

export default function ModelCard({ model, provider, modelInfo, price, group, ownedbyIcon, type, formatPrice, onViewDetail }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const inputModalities = modelInfo ? parseJsonArray(modelInfo.input_modalities) : [];
  const outputModalities = modelInfo ? parseJsonArray(modelInfo.output_modalities) : [];
  const tags = modelInfo ? parseJsonArray(modelInfo.tags) : [];
  const isTimesBilling = type === 'times';
  const displayName = modelInfo?.name || model;
  const billingStatusText = isTimesBilling ? '按次计费' : '按量计费';
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
          label:
            endpoint.protocol === 'openai'
              ? 'OpenAI'
              : endpoint.protocol === 'gemini'
                ? 'Gemini'
                : endpoint.protocol === 'claude'
                  ? 'Claude'
                  : endpoint.protocol,
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
      color: tag === 'Hot' ? 'error' : 'default'
    }))
  ].slice(0, 4);

  return (
    <Card
      onClick={onViewDetail}
      sx={{
        height: '100%',
        p: 1.35,
        borderRadius: '16px',
        border: 'none',
        boxShadow: 'none',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s ease, transform 0.18s ease, background-color 0.18s ease',
        backgroundColor:
          theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.72) : alpha(theme.palette.background.paper, 0.98),
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark' ? '0 12px 24px rgba(0,0,0,0.26)' : '0 10px 24px rgba(15,23,42,0.08)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.25}>
        <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, flex: 1 }}>
          <Avatar
            src={ownedbyIcon}
            alt={provider}
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              boxShadow: theme.palette.mode === 'dark' ? '0 4px 10px rgba(0,0,0,0.28)' : '0 4px 10px rgba(15,23,42,0.12)',
              '.MuiAvatar-img': {
                objectFit: 'contain',
                p: '5px'
              }
            }}
          >
            {provider?.charAt(0).toUpperCase()}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
              <Tooltip title={displayName}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    lineHeight: 1.1,
                    fontSize: '1.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayName}
                </Typography>
              </Tooltip>
            </Stack>

            <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 0.45 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                {t('modelpricePage.input')}{' '}
                <span style={{ color: theme.palette.warning.main, fontWeight: 700, fontSize: '0.86rem' }}>
                  {formatPrice(price.input, type)}
                </span>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.78rem' }}>
                {t('modelpricePage.output')}{' '}
                <span style={{ color: theme.palette.warning.main, fontWeight: 700, fontSize: '0.86rem' }}>
                  {formatPrice(price.output, type)}
                </span>
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
          <Tooltip title={t('modelpricePage.copyModelId')}>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                copy(model, t('modelpricePage.modelId'));
              }}
              sx={{
                width: 30,
                height: 30,
                border: `1px solid ${theme.palette.mode === 'dark' ? alpha('#fff', 0.12) : alpha('#64748b', 0.22)}`,
                color: theme.palette.text.secondary
              }}
            >
              <Icon icon="eva:copy-outline" width={16} height={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 1.1,
          fontSize: '0.82rem',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 40
        }}
      >
        {modelInfo?.description || model}
      </Typography>

      {endpointTypes.length > 0 && (
        <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" sx={{ mt: 1.15 }}>
          {endpointTypes.map((endpoint) => (
            <Label
              key={endpoint.key}
              variant="soft"
              color={endpoint.color}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.55,
                fontSize: '0.72rem',
                py: 0.2,
                px: 0.9,
                borderRadius: '999px'
              }}
            >
              <Icon icon="eva:link-2-outline" width={12} height={12} />
              {endpoint.label}
            </Label>
          ))}
        </Stack>
      )}

      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 1.25 }}>
        <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" sx={{ minWidth: 0, flex: 1 }}>
          {metaTags.map((item) => (
            <Label
              key={item.key}
              variant="soft"
              color={item.color}
              sx={{
                fontSize: '0.72rem',
                py: 0.2,
                px: 0.75,
                borderRadius: '999px'
              }}
            >
              {item.label}
            </Label>
          ))}

          {group?.ratio > 1 && (
            <Label
              variant="soft"
              color={group.ratio > 1 ? 'warning' : 'info'}
              sx={{
                fontSize: '0.72rem',
                py: 0.2,
                px: 0.75,
                borderRadius: '999px'
              }}
            >
              x{group.ratio}
            </Label>
          )}
        </Stack>

        <Box
          sx={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.6,
            px: 1,
            py: 0.55,
            borderRadius: '999px',
            bgcolor: alpha(theme.palette.success.main, 0.12),
            color: theme.palette.text.secondary,
            fontSize: '0.76rem',
            fontWeight: 700
          }}
        >
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: theme.palette.success.main
            }}
          />
          {billingStatusText}
        </Box>
      </Stack>
    </Card>
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
