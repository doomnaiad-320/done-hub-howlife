import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

const defaultForm = {
  invoice_type: 'vat_general',
  bank_name: '',
  bank_account: '',
  address: '',
  phone: '',
  remark: '',
  receiver_email: ''
};

const InvoiceApplyDialog = ({ open, orders, boundEmail, submitting, onClose, onSubmit }) => {
  const [formValues, setFormValues] = useState(defaultForm);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormValues((prev) => ({
      ...defaultForm,
      invoice_type: prev.invoice_type || 'vat_general',
      receiver_email: boundEmail || ''
    }));
  }, [boundEmail, open]);

  const totalAmount = useMemo(() => {
    return orders.reduce((sum, item) => sum + Number(item.order_amount || 0), 0);
  }, [orders]);

  const currencies = useMemo(() => [...new Set(orders.map((item) => item.order_currency).filter(Boolean))], [orders]);
  const hasMixedCurrency = currencies.length > 1;
  const currency = currencies[0] || '';
  const requiredFieldsFilled = formValues.bank_name && formValues.bank_account && formValues.address && formValues.phone;

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formValues);
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>申请开票</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {!boundEmail && <Alert severity="warning">请先在个人设置中绑定邮箱后再申请开票。</Alert>}
          {hasMixedCurrency && <Alert severity="warning">当前选择包含不同币种的充值记录，暂不支持合并开票。</Alert>}

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.neutral'
            }}
          >
            <Stack spacing={1}>
              <Typography variant="subtitle2">本次开票信息</Typography>
              <Typography variant="body2">选中记录：{orders.length} 条</Typography>
              <Typography variant="body2">
                发票金额：{totalAmount.toFixed(2)} {currency}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                发票金额按充值记录的实付金额自动汇总，不可修改。
              </Typography>
            </Stack>
          </Box>

          <FormControl fullWidth>
            <InputLabel htmlFor="invoice-type">发票类型</InputLabel>
            <Select
              id="invoice-type"
              name="invoice_type"
              value={formValues.invoice_type}
              label="发票类型"
              onChange={handleFieldChange}
            >
              <MenuItem value="vat_general">增值税普通发票</MenuItem>
              <MenuItem value="vat_special">增值税专用发票</MenuItem>
            </Select>
          </FormControl>

          <TextField label="开户银行" name="bank_name" value={formValues.bank_name} onChange={handleFieldChange} fullWidth required />
          <TextField label="银行账号" name="bank_account" value={formValues.bank_account} onChange={handleFieldChange} fullWidth required />
          <TextField label="地址" name="address" value={formValues.address} onChange={handleFieldChange} fullWidth required />
          <TextField label="电话" name="phone" value={formValues.phone} onChange={handleFieldChange} fullWidth required />
          <TextField
            label="发票备注"
            name="remark"
            value={formValues.remark}
            onChange={handleFieldChange}
            fullWidth
            multiline
            minRows={3}
          />

          <FormControl fullWidth>
            <InputLabel htmlFor="receiver-email">接收邮箱</InputLabel>
            <OutlinedInput
              id="receiver-email"
              name="receiver_email"
              label="接收邮箱"
              value={boundEmail || formValues.receiver_email}
              disabled
            />
          </FormControl>

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              关联充值记录
            </Typography>
            <Stack spacing={0.75}>
              {orders.map((item) => (
                <Typography key={item.id} variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {item.trade_no} · {Number(item.order_amount || 0).toFixed(2)} {item.order_currency}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          取消
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !boundEmail || hasMixedCurrency || orders.length === 0 || !requiredFieldsFilled}
        >
          {submitting ? '提交中...' : '提交开票申请'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

InvoiceApplyDialog.propTypes = {
  open: PropTypes.bool,
  orders: PropTypes.array,
  boundEmail: PropTypes.string,
  submitting: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func
};

export default InvoiceApplyDialog;
