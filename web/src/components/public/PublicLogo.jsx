import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import logoLight from 'assets/images/logo.svg';
import logoDark from 'assets/images/logo-white.svg';
import { cn } from './utils';

const PublicLogo = ({ className }) => {
  const siteInfo = useSelector((state) => state.siteInfo);
  const theme = useTheme();
  const defaultLogo = theme.palette.mode === 'light' ? logoLight : logoDark;
  const src = siteInfo.logo || defaultLogo;

  return <img src={src} alt={siteInfo.system_name || 'Done Hub'} className={cn('h-9 w-auto object-contain', className)} />;
};

export default PublicLogo;
