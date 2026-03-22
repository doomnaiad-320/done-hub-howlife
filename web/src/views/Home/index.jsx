import React, { useEffect, useState } from 'react';
import { showError } from 'utils/common';
import { API } from 'utils/api';
import { useTranslation } from 'react-i18next';
import ContentViewer from 'ui-component/ContentViewer';
import PublicLandingPage from 'components/public/PublicLandingPage';
import PublicNavbar from 'components/public/PublicNavbar';
import PublicFooter from 'components/public/PublicFooter';

const Home = () => {
  const { t } = useTranslation();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    try {
      const res = await API.get('/api/home_page_content');
      const { success, message, data } = res.data;
      if (success) {
        setHomePageContent(data);
        localStorage.setItem('home_page_content', data);
      } else {
        showError(message);
        setHomePageContent(t('home.loadingErr'));
      }
      setHomePageContentLoaded(true);
    } catch (error) {
      setHomePageContentLoaded(true);
    }
  };

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <>
      {homePageContentLoaded && homePageContent === '' ? (
        <PublicLandingPage />
      ) : (
        <div className="public-theme">
          <PublicNavbar landingAnchors={false} />
          <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
              <ContentViewer
                content={homePageContent}
                loading={!homePageContentLoaded}
                errorMessage={homePageContent === t('home.loadingErr') ? t('home.loadingErr') : ''}
                containerStyle={{ minHeight: '50vh' }}
                contentStyle={{ fontSize: 'larger' }}
              />
            </div>
          </main>
          <PublicFooter />
        </div>
      )}
    </>
  );
};

export default Home;
