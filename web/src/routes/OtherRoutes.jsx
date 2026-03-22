import { lazy } from 'react';
import { Box } from '@mui/material';

// project imports
import Loadable from 'ui-component/Loadable';
import MinimalLayout from 'layout/MinimalLayout';
import PublicPageLayout from 'layout/PublicPageLayout';

// login option 3 routing
const AuthLogin = Loadable(lazy(() => import('views/Authentication/Auth/Login')));
const AuthRegister = Loadable(lazy(() => import('views/Authentication/Auth/Register')));
const GitHubOAuth = Loadable(lazy(() => import('views/Authentication/Auth/GitHubOAuth')));
const LarkOAuth = Loadable(lazy(() => import('views/Authentication/Auth/LarkOAuth')));
const OIDCOAuth = Loadable(lazy(() => import('views/Authentication/Auth/OIDCOAuth')));
const LinuxDoOAuth = Loadable(lazy(() => import('views/Authentication/Auth/LinuxDoOAuth')));
const ForgetPassword = Loadable(lazy(() => import('views/Authentication/Auth/ForgetPassword')));
const ResetPassword = Loadable(lazy(() => import('views/Authentication/Auth/ResetPassword')));
const Home = Loadable(lazy(() => import('views/Home')));
const About = Loadable(lazy(() => import('views/About')));
const NotFoundView = Loadable(lazy(() => import('views/Error')));
const Jump = Loadable(lazy(() => import('views/Jump')));
const Playground = Loadable(lazy(() => import('views/Playground')));
const ModelPrice = Loadable(lazy(() => import('views/ModelPrice')));

const WithMargins = ({ children }) => (
  <Box
    sx={{
      maxWidth: 'none',
      margin: '0 auto',
      padding: { xs: 0, sm: '0 24px' }
    }}
  >
    {children}
  </Box>
);

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const OtherRoutes = {
  path: '/',
  children: [
    {
      element: <PublicPageLayout />,
      children: [
        {
          index: true,
          element: <Home />
        },
        {
          path: 'login',
          element: <AuthLogin />
        },
        {
          path: 'register',
          element: <AuthRegister />
        }
      ]
    },
    {
      element: <MinimalLayout />,
      children: [
        {
          path: 'about',
          element: <About />
        },
        {
          path: 'reset',
          element: <ForgetPassword />
        },
        {
          path: 'user/reset',
          element: <ResetPassword />
        },
        {
          path: 'oauth/github',
          element: <GitHubOAuth />
        },
        {
          path: 'oauth/oidc',
          element: <OIDCOAuth />
        },
        {
          path: 'oauth/lark',
          element: <LarkOAuth />
        },
        {
          path: 'oauth/linuxdo',
          element: <LinuxDoOAuth />
        },
        {
          path: '404',
          element: <NotFoundView />
        },
        {
          path: 'jump',
          element: <Jump />
        },
        {
          path: 'playground',
          element: <Playground />
        },
        {
          path: 'price',
          element: (
            <WithMargins>
              <ModelPrice />
            </WithMargins>
          )
        }
      ]
    }
  ]
};

export default OtherRoutes;
