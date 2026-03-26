import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  LinearProgress,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Typography
} from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Icon } from '@iconify/react';
import Label from 'ui-component/Label';
import { API } from 'utils/api';
import { PAGE_SIZE_OPTIONS, getPageSize, savePageSize } from 'constants';
import { renderQuota, showError, timestamp2string } from 'utils/common';

const TAB_VALUE = {
  order: 'order',
  redemption: 'redemption'
};

const TopupRecords = ({ refreshFlag }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(TAB_VALUE.order);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => getPageSize('topupRecords'));
  const [listCount, setListCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const [redemptionLogs, setRedemptionLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [localRefreshFlag, setLocalRefreshFlag] = useState(0);

  const paymentMap = useMemo(() => {
    return new Map(payments.map((item) => [item.id, item.name]));
  }, [payments]);

  const statusMap = useMemo(() => ({
    pending: { color: 'primary', label: t('topupPage.status.pending') },
    success: { color: 'success', label: t('topupPage.status.success') },
    failed: { color: 'error', label: t('topupPage.status.failed') },
    closed: { color: 'default', label: t('topupPage.status.closed') }
  }), [t]);

  const fetchPayments = useCallback(async() => {
    try {
      const res = await API.get('/api/user/payment');
      const { success, message, data } = res.data;
      if (success) {
        setPayments(data || []);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchData = useCallback(async() => {
    setLoading(true);
    try {
      const url = tab === TAB_VALUE.order ? '/api/user/order' : '/api/user/redemption/log';
      const res = await API.get(url, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          order: '-created_at'
        }
      });
      const { success, message, data } = res.data;
      if (success) {
        setListCount(data.total_count);
        if (tab === TAB_VALUE.order) {
          setOrderList(data.data || []);
        } else {
          setRedemptionLogs(data.data || []);
        }
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, tab]);

  useEffect(() => {
    fetchPayments().then();
  }, [fetchPayments]);

  useEffect(() => {
    fetchData().then();
  }, [fetchData, localRefreshFlag, refreshFlag]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setPage(0);
    setListCount(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    savePageSize('topupRecords', newRowsPerPage);
  };

  const handleRefresh = () => {
    setPage(0);
    setLocalRefreshFlag((prev) => prev + 1);
  };

  const renderOrderEmpty = (
    <TableRow>
      <TableCell colSpan={7} align="center">
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          {t('topupPage.emptyRechargeLogs')}
        </Typography>
      </TableCell>
    </TableRow>
  );

  const renderRedemptionEmpty = (
    <TableRow>
      <TableCell colSpan={3} align="center">
        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
          {t('topupPage.emptyRedemptionLogs')}
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Card>
      <Box sx={{ px: 3, pt: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Typography variant="h4">{t('topupPage.recordsTitle')}</Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRefresh}
            startIcon={<Icon icon="solar:refresh-circle-bold-duotone" width={18} />}
          >
            {t('topupPage.refresh')}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab label={t('topupPage.rechargeLogs')} value={TAB_VALUE.order} />
          <Tab label={t('topupPage.redemptionLogs')} value={TAB_VALUE.redemption} />
        </Tabs>
      </Box>

      {loading && <LinearProgress />}

      <PerfectScrollbar component="div">
        <TableContainer sx={{ overflow: 'unset' }}>
          {tab === TAB_VALUE.order ? (
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('orderlogPage.tableHeaders.created_at')}</TableCell>
                  <TableCell>{t('topupPage.paymentMethod')}</TableCell>
                  <TableCell>{t('orderlogPage.tableHeaders.amount')}</TableCell>
                  <TableCell>{t('orderlogPage.tableHeaders.order_amount')}</TableCell>
                  <TableCell>{t('orderlogPage.tableHeaders.quota')}</TableCell>
                  <TableCell>{t('orderlogPage.tableHeaders.status')}</TableCell>
                  <TableCell>{t('orderlogPage.tableHeaders.trade_no')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderList.length === 0
                  ? renderOrderEmpty
                  : orderList.map((item) => {
                    const status = statusMap[item.status] || {
                      color: 'default',
                      label: item.status || '-'
                    };

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{timestamp2string(item.created_at)}</TableCell>
                        <TableCell>{paymentMap.get(item.gateway_id) || `#${item.gateway_id}`}</TableCell>
                        <TableCell>${item.amount}</TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">
                              {item.order_amount} {item.order_currency}
                            </Typography>
                            {Number(item.fee) > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {t('orderlogPage.tableHeaders.fee')}: {item.fee} {item.order_currency}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{renderQuota(item.quota)}</TableCell>
                        <TableCell>
                          <Label color={status.color}>{status.label}</Label>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {item.trade_no}
                            </Typography>
                            {item.gateway_no && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                {item.gateway_no}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('orderlogPage.tableHeaders.created_at')}</TableCell>
                  <TableCell>{t('orderlogPage.tableHeaders.quota')}</TableCell>
                  <TableCell>{t('topupPage.detail')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {redemptionLogs.length === 0
                  ? renderRedemptionEmpty
                  : redemptionLogs.map((item, index) => (
                    <TableRow key={`${item.created_at}_${index}`} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{timestamp2string(item.created_at)}</TableCell>
                      <TableCell>{renderQuota(item.quota)}</TableCell>
                      <TableCell>{item.content}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </PerfectScrollbar>

      <TablePagination
        component="div"
        count={listCount}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
      />
    </Card>
  );
};

TopupRecords.propTypes = {
  refreshFlag: PropTypes.number
};

export default TopupRecords;
