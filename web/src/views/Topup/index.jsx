import { useState } from 'react';
import { Stack, Alert } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import TopupCard from './component/TopupCard';
import InviteCard from './component/InviteCard';
import TopupRecords from './component/TopupRecords';
import { useTranslation } from 'react-i18next';

const Topup = () => {
  const { t } = useTranslation();
  const [refreshFlag, setRefreshFlag] = useState(0);

  const handleRecordChanged = () => {
    setRefreshFlag((prev) => prev + 1);
  };

  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <Alert severity="info">{t('topupPage.alertMessage')}</Alert>
      </Grid>
      <Grid xs={12} md={6} lg={8}>
        <Stack spacing={2}>
          <TopupCard onRecordChanged={handleRecordChanged} />
        </Stack>
      </Grid>
      <Grid xs={12} md={6} lg={4}>
        <InviteCard />
      </Grid>
      <Grid xs={12}>
        <TopupRecords refreshFlag={refreshFlag} />
      </Grid>
    </Grid>
  );
};

export default Topup;
