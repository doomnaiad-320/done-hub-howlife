import { useTranslation } from 'react-i18next';
import PublicAuthShell from 'components/public/PublicAuthShell';
import PublicRegisterForm from 'components/public/PublicRegisterForm';

const Register = () => {
  const { t } = useTranslation();

  return (
    <PublicAuthShell
      title={t('publicAuth.register.title')}
      description={t('publicAuth.register.description')}
      previewEyebrow={t('publicAuth.register.previewEyebrow')}
      previewTitle={t('publicAuth.register.previewTitle')}
      previewDescription={t('publicAuth.register.previewDescription')}
      previewItems={[
        t('publicAuth.register.previewItem1'),
        t('publicAuth.register.previewItem2'),
        t('publicAuth.register.previewItem3')
      ]}
      imageLight="/feature-1-light.png"
      imageDark="/feature-1-dark.png"
    >
      <PublicRegisterForm />
    </PublicAuthShell>
  );
};

export default Register;
