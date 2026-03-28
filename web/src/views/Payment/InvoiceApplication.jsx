import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from '@mui/material';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Icon } from '@iconify/react';
import Label from 'ui-component/Label';
import { API } from 'utils/api';
import { PAGE_SIZE_OPTIONS, getPageSize, savePageSize } from 'constants';
import { showError, showSuccess, timestamp2string } from 'utils/common';

const statusMap = {
  pending: { color: 'warning', label: '待处理' },
  sent: { color: 'success', label: '已发送' }
};

const invoiceTypeMap = {
  vat_general: '增值税普通发票',
  vat_special: '增值税专用发票'
};

export default function InvoiceApplication() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => getPageSize('paymentInvoiceApplication'));
  const [listCount, setListCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState(0);
  const [applications, setApplications] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const fetchData = useCallback(async() => {
    setLoading(true);
    try {
      const res = await API.get('/api/payment/invoice_application', {
        params: {
          page: page + 1,
          size: rowsPerPage,
          order: '-created_at'
        }
      });
      const { success, message, data } = res.data;
      if (success) {
        setApplications(data.data || []);
        setListCount(data.total_count || 0);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchData().then();
  }, [fetchData, refreshFlag]);

  const handleRefresh = () => {
    setPage(0);
    setRefreshFlag((prev) => prev + 1);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    savePageSize('paymentInvoiceApplication', newRowsPerPage);
  };

  const handleMarkSent = async(id) => {
    setSendingId(id);
    try {
      const res = await API.put(`/api/payment/invoice_application/${id}/sent`);
      const { success, message } = res.data;
      if (success) {
        showSuccess('已标记为已发送');
        setRefreshFlag((prev) => prev + 1);
      } else {
        showError(message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSendingId(0);
    }
  };

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3, pb: 2 }}>
        <Typography variant="h4">开票申请</Typography>
        <Button variant="outlined" startIcon={<Icon icon="solar:refresh-circle-bold-duotone" width={18} />} onClick={handleRefresh}>
          刷新
        </Button>
      </Stack>

      {loading && <LinearProgress />}

      <PerfectScrollbar component="div">
        <TableContainer sx={{ overflow: 'unset' }}>
          <Table sx={{ minWidth: 1380 }}>
            <TableHead>
              <TableRow>
                <TableCell>申请时间</TableCell>
                <TableCell>用户ID</TableCell>
                <TableCell>开票金额</TableCell>
                <TableCell>发票类型</TableCell>
                <TableCell>接收邮箱</TableCell>
                <TableCell>发票信息</TableCell>
                <TableCell>关联订单</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((item) => {
                const status = statusMap[item.status] || { color: 'default', label: item.status || '-' };

                return (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{timestamp2string(item.created_at)}</TableCell>
                    <TableCell>{item.user_id}</TableCell>
                    <TableCell>
                      {Number(item.amount || 0).toFixed(2)} {item.currency}
                    </TableCell>
                    <TableCell>{invoiceTypeMap[item.invoice_type] || item.invoice_type}</TableCell>
                    <TableCell>{item.receiver_email || '-'}</TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="caption">开户银行：{item.bank_name || '-'}</Typography>
                        <Typography variant="caption">银行账号：{item.bank_account || '-'}</Typography>
                        <Typography variant="caption">地址：{item.address || '-'}</Typography>
                        <Typography variant="caption">电话：{item.phone || '-'}</Typography>
                        <Typography variant="caption">备注：{item.remark || '-'}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {(item.orders || []).map((order) => (
                          <Typography key={order.id} variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {order.trade_no} · {Number(order.order_amount || 0).toFixed(2)} {order.order_currency}
                          </Typography>
                        ))}
                        {(!item.orders || item.orders.length === 0) && <Typography variant="caption">-</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Label color={status.color}>{status.label}</Label>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={item.status === 'sent' || sendingId === item.id}
                        onClick={() => handleMarkSent(item.id)}
                      >
                        {item.status === 'sent' ? '已发送' : sendingId === item.id ? '提交中...' : '标记已发送'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {applications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      暂无开票申请
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </PerfectScrollbar>

      <Box>
        <TablePagination
          page={page}
          component="div"
          count={listCount}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={PAGE_SIZE_OPTIONS}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </Box>
    </Card>
  );
}
