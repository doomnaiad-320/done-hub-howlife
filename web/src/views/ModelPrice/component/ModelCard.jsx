import PropTypes from 'prop-types';
import { Card, Typography, Box, Avatar, Stack, IconButton, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Icon } from '@iconify/react';
import { copy } from 'utils/common';
import { useTranslation } from 'react-i18next';

function DetailRow({ label, children, divider = true }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1.5}
      sx={{
        py: 0.88,
        borderTop: divider ? '1px solid' : 'none',
        borderColor: 'divider'
      }}
    >
      <Typography
        color="text.secondary"
        sx={{
          fontSize: '0.74rem',
          fontWeight: 500,
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 0.8,
          flexWrap: 'wrap'
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
  divider: PropTypes.bool
};

function ValuePill({ text, tone = 'success' }) {
  const theme = useTheme();

  const toneMap = {
    success: {
      border: alpha(theme.palette.success.main, 0.4),
      background: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
      color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark
    },
    warning: {
      border: alpha(theme.palette.warning.main, 0.42),
      background: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
      color: theme.palette.mode === 'dark' ? theme.palette.warning.light : '#c77700'
    },
    info: {
      border: alpha(theme.palette.info.main, 0.32),
      background: alpha(theme.palette.info.main, theme.palette.mode === 'dark' ? 0.18 : 0.1),
      color: theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.info.dark
    }
  };

  const currentTone = toneMap[tone] || toneMap.success;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 26,
        px: 0.9,
        borderRadius: '9px',
        border: `1px solid ${currentTone.border}`,
        backgroundColor: currentTone.background,
        color: currentTone.color,
        fontSize: '0.76rem',
        fontWeight: 700,
        lineHeight: 1.15,
        whiteSpace: 'nowrap'
      }}
    >
      {text}
    </Box>
  );
}

ValuePill.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['success', 'warning', 'info'])
};

function MetricPair({ label, value, tone = 'success', align = 'left' }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent={align === 'right' ? 'flex-end' : 'flex-start'}
      spacing={0.75}
      sx={{ minWidth: 0 }}
    >
      <Typography
        color="text.secondary"
        sx={{
          fontSize: '0.74rem',
          fontWeight: 500,
          whiteSpace: 'nowrap'
        }}
      >
        {label}
      </Typography>
      <ValuePill text={value} tone={tone} />
    </Stack>
  );
}

MetricPair.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  tone: PropTypes.oneOf(['success', 'warning', 'info']),
  align: PropTypes.oneOf(['left', 'right'])
};

export default function ModelCard({ model, provider, modelInfo, price, group, ownedbyIcon, type, formatPrice, onViewDetail }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const isTimesBilling = type === 'times';
  const displayName = modelInfo?.name || model;
  const detailText = modelInfo?.description?.trim() || model;
  const billingStatusText = isTimesBilling ? t('modelpricePage.times') : t('modelpricePage.tokens');
  const groupName = group?.name || t('modelpricePage.noneGroup');
  const groupRatio = group?.ratio ?? null;
  const billingTone = isTimesBilling
    ? {
        color: theme.palette.mode === 'dark' ? theme.palette.warning.light : '#c77700',
        dot: theme.palette.warning.main
      }
    : {
        color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark,
        dot: theme.palette.success.main
      };
  const headerGradient =
    theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${alpha('#1f6f78', 0.32)} 0%, ${alpha('#1d4f59', 0.24)} 45%, ${alpha('#334155', 0.34)} 100%)`
      : `linear-gradient(135deg, ${alpha('#f7fbf7', 0.98)} 0%, ${alpha('#e5f7ef', 0.98)} 42%, ${alpha('#eef7fb', 0.98)} 100%)`;
  const cardBorder = theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#0f172a', 0.08);

  return (
    <Card
      onClick={onViewDetail}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '18px',
        overflow: 'hidden',
        border: `1px solid ${cardBorder}`,
        boxShadow: theme.palette.mode === 'dark' ? '0 16px 36px rgba(0,0,0,0.22)' : '0 14px 34px rgba(15,23,42,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        backgroundColor: theme.palette.background.paper,
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: alpha(theme.palette.primary.main, 0.22),
          boxShadow: theme.palette.mode === 'dark' ? '0 20px 42px rgba(0,0,0,0.28)' : '0 20px 42px rgba(15,23,42,0.12)'
        }
      }}
    >
      <Box
        sx={{
          px: 2.1,
          py: 1.9,
          background: headerGradient,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.75)}`
        }}
      >
        <Stack direction="row" justifyContent="space-between" spacing={1.5}>
          <Stack direction="row" spacing={1.25} sx={{ minWidth: 0, flex: 1 }}>
            <Avatar
              src={ownedbyIcon}
              alt={provider}
              sx={{
                width: 42,
                height: 42,
                bgcolor: alpha(theme.palette.background.paper, 0.96),
                border: `1px solid ${alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.08 : 0.7)}`,
                boxShadow: theme.palette.mode === 'dark' ? '0 6px 18px rgba(0,0,0,0.2)' : '0 6px 14px rgba(15,23,42,0.08)',
                '.MuiAvatar-img': {
                  objectFit: 'contain',
                  p: '6px'
                }
              }}
            >
              {provider?.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Tooltip title={displayName}>
                <Typography
                  sx={{
                    fontSize: '1.06rem',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: theme.palette.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayName}
                </Typography>
              </Tooltip>
              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.28,
                  fontSize: '0.78rem',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {provider}
              </Typography>
            </Box>
          </Stack>

          <Tooltip title={t('modelpricePage.copyModelId')}>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                copy(model, t('modelpricePage.modelId'));
              }}
              sx={{
                mt: 0.15,
                width: 34,
                height: 34,
                color: alpha(theme.palette.text.primary, 0.72),
                backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.12 : 0.42),
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.18 : 0.7)
                }
              }}
            >
              <Icon icon="eva:copy-outline" width={17} height={17} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          px: 2.1,
          py: 1.45
        }}
      >
        <Box
          sx={{
            pt: 0.2,
            pb: 0.9,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography
            sx={{
              color: theme.palette.mode === 'dark' ? alpha(theme.palette.text.primary, 0.84) : alpha(theme.palette.text.primary, 0.78),
              fontSize: '0.82rem',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.3em'
            }}
          >
            {detailText}
          </Typography>
        </Box>

        <Box
          sx={{
            py: 0.88,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.55,
              color: billingTone.color,
              fontSize: '0.8rem',
              fontWeight: 700,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              minWidth: 0
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: billingTone.dot,
                flexShrink: 0
              }}
            />
            {billingStatusText}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.25, minWidth: 0, flex: 1 }}>
            <MetricPair label={t('modelpricePage.input')} value={formatPrice(price.input, type)} tone="success" align="right" />
            <MetricPair label={t('modelpricePage.output')} value={formatPrice(price.output, type)} tone="warning" align="right" />
          </Box>
        </Box>

        <DetailRow label={t('modelpricePage.currentUserGroup')} divider={false}>
          <ValuePill text={groupName} tone="info" />
          {groupRatio !== null ? <ValuePill text={`x${groupRatio}`} tone="info" /> : null}
        </DetailRow>

        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Box
            component="button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onViewDetail();
            }}
            sx={{
              width: '100%',
              height: 38,
              border: 'none',
              borderRadius: '11px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              bgcolor: theme.palette.mode === 'dark' ? alpha('#0f172a', 0.88) : '#1f2937',
              color: '#fff',
              fontSize: '0.86rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.16s ease, background-color 0.16s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                bgcolor: theme.palette.mode === 'dark' ? alpha('#0b1220', 0.96) : '#111827'
              }
            }}
          >
            {t('modelpricePage.viewDetail')}
            <Icon icon="eva:arrow-forward-outline" width={18} height={18} />
          </Box>
        </Box>
      </Box>
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
