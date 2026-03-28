import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
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
import { renderQuota, showError, showSuccess, timestamp2string } from 'utils/common';
import InvoiceApplyDialog from './InvoiceApplyDialog';

const TAB_VALUE = {
  order: 'order',
  redemption: 'redemption'
};

const TopupRecords = ({ refreshFlag = 0 }) => {
  const { t } = useTranslation();
  const account = useSelector((state) => state.account);
  const [tab, setTab] = useState(TAB_VALUE.order);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => getPageSize('topupRecords'));
  const [listCount, setListCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const [redemptionLogs, setRedemptionLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [localRefreshFlag, setLocalRefreshFlag] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [boundEmail, setBoundEmail] = useState(account.user?.email || '');

  const paymentMap = useMemo(() => {
    return new Map(payments.map((item) => [item.id, item.name]));
  }, [payments]);

  const statusMap = useMemo(
    () => ({
      pending: { color: 'primary', label: t('topupPage.status.pending') },
      success: { color: 'success', label: t('topupPage.status.success') },
      failed: { color: 'error', label: t('topupPage.status.failed') },
      closed: { color: 'default', label: t('topupPage.status.closed') }
    }),
    [t]
  );

  const invoiceStatusMap = useMemo(
    () => ({
      pending: { color: 'warning', label: '申请中' },
      sent: { color: 'success', label: '已发送' }
    }),
    []
  );

  const selectedOrders = useMemo(() => {
    return orderList.filter((item) => selectedOrderIds.includes(item.id));
  }, [orderList, selectedOrderIds]);

  const invoiceableOrders = useMemo(() => {
    return orderList.filter((item) => item.status === 'success' && !item.invoice_status && !item.invoice_application_id);
  }, [orderList]);

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

  const fetchBoundEmail = useCallback(async() => {
    try {
      const res = await API.get('/api/user/self');
      const { success, data } = res.data;
      if (success) {
        setBoundEmail(data?.email || '');
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
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, tab]);

  useEffect(() => {
    fetchPayments().then();
    fetchBoundEmail().then();
  }, [fetchPayments, fetchBoundEmail]);

  useEffect(() => {
    fetchData().then();
  }, [fetchData, localRefreshFlag, refreshFlag]);

  useEffect(() => {
    setSelectedOrderIds((prev) => prev.filter((id) => orderList.some((item) => item.id === id)));
  }, [orderList]);

  useEffect(() => {
    if (tab !== TAB_VALUE.order) {
      setSelectedOrderIds([]);
    }
  }, [tab]);

  useEffect(() => {
    if (account.user?.email) {
      setBoundEmail(account.user.email);
    }
  }, [account.user?.email]);

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
    setSelectedOrderIds([]);
    setLocalRefreshFlag((prev) => prev + 1);
  };

  const handleToggleOrder = (orderID) => {
    setSelectedOrderIds((prev) => (prev.includes(orderID) ? prev.filter((id) => id !== orderID) : [...prev, orderID]));
  };

  const handleToggleAllOrders = () => {
    if (invoiceableOrders.length === 0) {
      return;
    }

    if (selectedOrderIds.length === invoiceableOrders.length) {
      setSelectedOrderIds([]);
      return;
    }

    setSelectedOrderIds(invoiceableOrders.map((item) => item.id));
  };

  const openInvoiceDialog = (orderIDs) => {
    if (!boundEmail) {
      showError('请先在个人设置中绑定邮箱后再申请开票');
      return;
    }

    if (!orderIDs.length) {
      showError('请选择需要开票的充值记录');
      return;
    }

    setSelectedOrderIds(orderIDs);
    setInvoiceDialogOpen(true);
  };

  const closeInvoiceDialog = () => {
    if (invoiceSubmitting) {
      return;
    }
    setInvoiceDialogOpen(false);
  };

  const handleSubmitInvoice = async(formValues) => {
    setInvoiceSubmitting(true);
    try {
      const res = await API.post('/api/user/invoice_application', {
        order_ids: selectedOrderIds,
        invoice_type: formValues.invoice_type,
        bank_name: formValues.bank_name,
        bank_account: formValues.bank_account,
        address: formValues.address,
        phone: formValues.phone,
        remark: formValues.remark,
        receiver_email: boundEmail
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess('开票申请已提交');
        setInvoiceDialogOpen(false);
        setSelectedOrderIds([]);
        handleRefresh();
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const renderOrderEmpty = (
    <TableRow>
      <TableCell colSpan={10} align="center">
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
    <>
      <Card>
        <Box sx={{ px: 3, pt: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2}>
            <Stack spacing={1}>
              <Typography variant="h4">{t('topupPage.recordsTitle')}</Typography>
              {!boundEmail && (
                <Alert severity="warning" sx={{ py: 0 }}>
                  请先在个人设置中绑定邮箱，再申请开票。
                </Alert>
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              {tab === TAB_VALUE.order && selectedOrderIds.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => openInvoiceDialog(selectedOrderIds)}
                  startIcon={<Icon icon="solar:bill-list-bold-duotone" width={18} />}
                >
                  批量开票
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                onClick={handleRefresh}
                startIcon={<Icon icon="solar:refresh-circle-bold-duotone" width={18} />}
              >
                {t('topupPage.refresh')}
              </Button>
            </Stack>
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
              <Table sx={{ minWidth: 1180 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={invoiceableOrders.length > 0 && selectedOrderIds.length === invoiceableOrders.length}
                        indeterminate={selectedOrderIds.length > 0 && selectedOrderIds.length < invoiceableOrders.length}
                        onChange={handleToggleAllOrders}
                      />
                    </TableCell>
                    <TableCell>{t('orderlogPage.tableHeaders.created_at')}</TableCell>
                    <TableCell>{t('topupPage.paymentMethod')}</TableCell>
                    <TableCell>{t('orderlogPage.tableHeaders.amount')}</TableCell>
                    <TableCell>{t('orderlogPage.tableHeaders.order_amount')}</TableCell>
                    <TableCell>{t('orderlogPage.tableHeaders.quota')}</TableCell>
                    <TableCell>{t('orderlogPage.tableHeaders.status')}</TableCell>
                    <TableCell>开票状态</TableCell>
                    <TableCell>{t('orderlogPage.tableHeaders.trade_no')}</TableCell>
                    <TableCell>操作</TableCell>
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
                      const invoiceStatus = invoiceStatusMap[item.invoice_status] || {
                        color: 'default',
                        label: '未开票'
                      };
                      const invoiceable = item.status === 'success' && !item.invoice_status && !item.invoice_application_id;

                      return (
                        <TableRow key={item.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedOrderIds.includes(item.id)}
                              disabled={!invoiceable}
                              onChange={() => handleToggleOrder(item.id)}
                            />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{timestamp2string(item.created_at)}</TableCell>
                          <TableCell>{paymentMap.get(item.gateway_id) || `#${item.gateway_id}`}</TableCell>
                          <TableCell>${item.amount}</TableCell>
                          <TableCell>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">
                                {Number(item.order_amount || 0).toFixed(2)} {item.order_currency}
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
                            <Label color={invoiceStatus.color}>{invoiceStatus.label}</Label>
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
                          <TableCell>
                            {invoiceable ? (
                              <Button variant="outlined" size="small" disabled={!boundEmail} onClick={() => openInvoiceDialog([item.id])}>
                                开票
                              </Button>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
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

      <InvoiceApplyDialog
        open={invoiceDialogOpen}
        orders={selectedOrders}
        boundEmail={boundEmail}
        submitting={invoiceSubmitting}
        onClose={closeInvoiceDialog}
        onSubmit={handleSubmitInvoice}
      />
    </>
  );
};

TopupRecords.propTypes = {
  refreshFlag: PropTypes.number
};

export default TopupRecords;
