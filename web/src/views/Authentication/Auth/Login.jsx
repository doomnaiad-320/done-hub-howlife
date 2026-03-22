import { useTranslation } from 'react-i18next';
import PublicAuthShell from 'components/public/PublicAuthShell';
import PublicLoginForm from 'components/public/PublicLoginForm';

const Login = () => {
  const { t } = useTranslation();

  return (
    <PublicAuthShell
      title={t('publicAuth.login.title')}
      description={t('publicAuth.login.description')}
      previewEyebrow={t('publicAuth.login.previewEyebrow')}
      previewTitle={t('publicAuth.login.previewTitle')}
      previewDescription={t('publicAuth.login.previewDescription')}
      previewItems={[
        t('publicAuth.login.previewItem1'),
        t('publicAuth.login.previewItem2'),
        t('publicAuth.login.previewItem3')
      ]}
      imageLight="/dashboard-light.png"
      imageDark="/dashboard-dark.png"
    >
      <PublicLoginForm />
    </PublicAuthShell>
  );
};

export default Login;
