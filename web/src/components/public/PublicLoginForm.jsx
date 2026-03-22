import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import useLogin from 'hooks/useLogin';
import WechatModal from 'views/Authentication/AuthForms/WechatModal';
import Github from 'assets/images/icons/github.svg';
import Wechat from 'assets/images/icons/wechat.svg';
import Lark from 'assets/images/icons/lark.svg';
import Oidc from 'assets/images/icons/oidc.svg';
import LinuxDoIcon from 'assets/images/icons/LinuxDoIcon';
import Webauthn from 'assets/images/icons/webauthn.svg';
import { onGitHubOAuthClicked, onLarkOAuthClicked, onLinuxDoOAuthClicked, onOIDCAuthClicked, onWebAuthnClicked } from 'utils/common';
import { useTranslation } from 'react-i18next';
import { cn } from './utils';

const inputClassName =
  'w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30';
const buttonClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70';
const secondaryButtonClassName =
  'inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

const OAuthButton = ({ icon, children, onClick }) => (
  <button type="button" onClick={onClick} className={secondaryButtonClassName}>
    {icon}
    <span>{children}</span>
  </button>
);

const PublicLoginForm = () => {
  const { t } = useTranslation();
  const siteInfo = useSelector((state) => state.siteInfo);
  const { login, wechatLogin } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [openWechat, setOpenWechat] = useState(false);

  const tripartiteLogin =
    siteInfo.github_oauth || siteInfo.wechat_login || siteInfo.lark_login || siteInfo.oidc_auth || siteInfo.linuxDo_oauth;

  const executeOAuthLogin = (provider) => {
    switch (provider) {
      case 'github':
        onGitHubOAuthClicked(siteInfo.github_client_id);
        break;
      case 'lark':
        onLarkOAuthClicked(siteInfo.lark_client_id);
        break;
      case 'oidc':
        onOIDCAuthClicked();
        break;
      case 'linuxdo':
        onLinuxDoOAuthClicked(siteInfo.linuxDo_client_id, true);
        break;
      default:
        break;
    }
  };

  return (
    <Formik
      initialValues={{
        username: '',
        password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        username: Yup.string().max(255).required(t('login.usernameRequired')),
        password: Yup.string().max(255).required(t('login.passwordRequired'))
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        const { success, message } = await login(values.username, values.password);

        if (success) {
          setStatus({ success: true });
        } else {
          setStatus({ success: false });
          if (message) {
            setErrors({ submit: message });
          }
        }

        setSubmitting(false);
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setErrors, setStatus }) => (
        <form onSubmit={handleSubmit} className="space-y-5">
          {tripartiteLogin ? (
            <div className="grid gap-3">
              {siteInfo.github_oauth ? (
                <OAuthButton
                  onClick={() => executeOAuthLogin('github')}
                  icon={<img src={Github} alt="GitHub" className="h-5 w-5" />}
                >
                  {t('login.useGithubLogin')}
                </OAuthButton>
              ) : null}

              {siteInfo.wechat_login ? (
                <>
                  <OAuthButton
                    onClick={() => setOpenWechat(true)}
                    icon={<img src={Wechat} alt="Wechat" className="h-5 w-5" />}
                  >
                    {t('login.useWechatLogin')}
                  </OAuthButton>
                  <WechatModal
                    open={openWechat}
                    handleClose={() => setOpenWechat(false)}
                    wechatLogin={wechatLogin}
                    qrCode={siteInfo.wechat_qrcode}
                  />
                </>
              ) : null}

              {siteInfo.lark_login ? (
                <OAuthButton onClick={() => executeOAuthLogin('lark')} icon={<img src={Lark} alt="Lark" className="h-5 w-5" />}>
                  {t('login.useLarkLogin')}
                </OAuthButton>
              ) : null}

              {siteInfo.oidc_auth ? (
                <OAuthButton onClick={() => executeOAuthLogin('oidc')} icon={<img src={Oidc} alt="OIDC" className="h-5 w-5" />}>
                  {t('login.useOIDCLogin')}
                </OAuthButton>
              ) : null}

              {siteInfo.linuxDo_oauth ? (
                <OAuthButton onClick={() => executeOAuthLogin('linuxdo')} icon={<LinuxDoIcon size={18} variant="login" />}>
                  {t('login.useLinuxDoLogin')}
                </OAuthButton>
              ) : null}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">{t('publicAuth.or')}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="login-username" className="text-sm font-medium text-foreground">
              {t('login.usernameOrEmail')}
            </label>
            <input
              id="login-username"
              type="text"
              name="username"
              autoComplete="username"
              value={values.username}
              onBlur={handleBlur}
              onChange={handleChange}
              className={cn(inputClassName, touched.username && errors.username && 'border-destructive ring-2 ring-destructive/20')}
              placeholder={t('login.usernameOrEmail')}
            />
            {touched.username && errors.username ? <p className="text-sm text-destructive">{errors.username}</p> : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                {t('login.password')}
              </label>
              <Link to="/reset" className="text-sm text-primary transition-colors hover:text-primary/80">
                {t('login.forgetPassword')}
              </Link>
            </div>

            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={values.password}
                onBlur={handleBlur}
                onChange={handleChange}
                className={cn(inputClassName, 'pr-12', touched.password && errors.password && 'border-destructive ring-2 ring-destructive/20')}
                placeholder={t('login.password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && errors.password ? <p className="text-sm text-destructive">{errors.password}</p> : null}
          </div>

          {errors.submit ? <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.submit}</p> : null}

          <button type="submit" disabled={isSubmitting} className={buttonClassName}>
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            <span>{isSubmitting ? t('login.loggingIn') : t('menu.login')}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onWebAuthnClicked(
                values.username,
                (message) => setErrors({ submit: message }),
                () => setStatus({ success: true }),
                () => {}
              )
            }
            className={secondaryButtonClassName}
          >
            <img src={Webauthn} alt="WebAuthn" className="h-5 w-5" />
            <span>WebAuthn</span>
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {t('publicAuth.login.noAccount')}{' '}
            <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
              {t('menu.signup')}
            </Link>
          </p>
        </form>
      )}
    </Formik>
  );
};

export default PublicLoginForm;
