import { Outlet } from 'react-router-dom';
import PublicFooter from 'components/public/PublicFooter';
import PublicNavbar from 'components/public/PublicNavbar';

const PublicSiteLayout = () => {
  return (
    <div className="public-theme flex min-h-screen flex-col bg-background">
      <PublicNavbar landingAnchors={false} />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicSiteLayout;
