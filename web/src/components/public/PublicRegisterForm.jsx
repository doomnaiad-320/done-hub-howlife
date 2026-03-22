import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Turnstile from 'react-turnstile';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import useRegister from 'hooks/useRegister';
import { strengthColor, strengthIndicator } from 'utils/password-strength';
import { showError, showInfo } from 'utils/common';
import { useTranslation } from 'react-i18next';
import { cn } from './utils';

const inputClassName =
  'w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30';
const buttonClassName =
  'inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70';

const PublicRegisterForm = () => {
  const { t } = useTranslation();
  const { register, sendVerificationCode } = useRegister();
  const siteInfo = useSelector((state) => state.siteInfo);
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [disableButton, setDisableButton] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [strength, setStrength] = useState(0);
  const [level, setLevel] = useState();

  const showEmailVerification = Boolean(siteInfo.email_verification);
  const showInviteCode = Boolean(siteInfo.invite_code_register);
  const turnstileEnabled = Boolean(siteInfo.turnstile_check);
  const turnstileSiteKey = siteInfo.turnstile_site_key || '';

  useEffect(() => {
    const affCode = searchParams.get('aff');
    if (affCode) {
      localStorage.setItem('aff', affCode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!disableButton) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setDisableButton(false);
          return 30;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [disableButton]);

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        username: Yup.string().max(255).required(t('registerForm.usernameRequired')),
        password: Yup.string().max(255).required(t('registerForm.passwordRequired')),
        confirmPassword: Yup.string()
          .required(t('registerForm.confirmPasswordRequired'))
          .oneOf([Yup.ref('password'), null], t('registerForm.passwordsNotMatch')),
        email: showEmailVerification
          ? Yup.string().email(t('registerForm.validEmailRequired')).max(255).required(t('registerForm.emailRequired'))
          : Yup.mixed(),
        verification_code: showEmailVerification
          ? Yup.string().max(255).required(t('registerForm.verificationCodeRequired'))
          : Yup.mixed(),
        invite_code: showInviteCode ? Yup.string().max(255).required(t('registerForm.inviteCodeRequired')) : Yup.mixed()
      }),
    [showEmailVerification, showInviteCode, t]
  );

  const handleSendCode = async (email) => {
    if (!email) {
      showError(t('registerForm.enterEmail'));
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      showError(t('registerForm.turnstileError'));
      return;
    }

    setDisableButton(true);
    const { success, message } = await sendVerificationCode(email, turnstileToken);

    if (!success) {
      showError(message);
      setDisableButton(false);
    }
  };

  return (
    <Formik
      enableReinitialize
      initialValues={{
        username: '',
        password: '',
        confirmPassword: '',
        email: showEmailVerification ? '' : undefined,
        verification_code: showEmailVerification ? '' : undefined,
        invite_code: showInviteCode ? '' : undefined,
        submit: null
      }}
      validationSchema={validationSchema}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        if (turnstileEnabled && !turnstileToken) {
          showInfo(t('registerForm.verificationInfo'));
          setSubmitting(false);
          return;
        }

        const { success, message } = await register(values, turnstileToken);

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
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="register-username" className="text-sm font-medium text-foreground">
              {t('publicAuth.fields.username')}
            </label>
            <input
              id="register-username"
              type="text"
              name="username"
              autoComplete="username"
              value={values.username}
              onBlur={handleBlur}
              onChange={handleChange}
              className={cn(inputClassName, touched.username && errors.username && 'border-destructive ring-2 ring-destructive/20')}
              placeholder={t('publicAuth.fields.username')}
            />
            {touched.username && errors.username ? <p className="text-sm text-destructive">{errors.username}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-medium text-foreground">
              {t('publicAuth.fields.password')}
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={values.password}
                onBlur={handleBlur}
                onChange={(event) => {
                  handleChange(event);
                  const nextStrength = strengthIndicator(event.target.value);
                  setStrength(nextStrength);
                  setLevel(strengthColor(nextStrength));
                }}
                className={cn(inputClassName, 'pr-12', touched.password && errors.password && 'border-destructive ring-2 ring-destructive/20')}
                placeholder={t('publicAuth.fields.password')}
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

          {strength ? (
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-24 rounded-full bg-secondary">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min((strength / 5) * 100, 100)}%`, backgroundColor: level?.color }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{level?.label}</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="register-confirm-password" className="text-sm font-medium text-foreground">
              {t('publicAuth.fields.confirmPassword')}
            </label>
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              autoComplete="new-password"
              value={values.confirmPassword}
              onBlur={handleBlur}
              onChange={handleChange}
              className={cn(
                inputClassName,
                touched.confirmPassword && errors.confirmPassword && 'border-destructive ring-2 ring-destructive/20'
              )}
              placeholder={t('publicAuth.fields.confirmPassword')}
            />
            {touched.confirmPassword && errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword}</p> : null}
          </div>

          {showEmailVerification ? (
            <>
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium text-foreground">
                  {t('publicAuth.fields.email')}
                </label>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={values.email || ''}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    className={cn(inputClassName, touched.email && errors.email && 'border-destructive ring-2 ring-destructive/20')}
                    placeholder={t('publicAuth.fields.email')}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendCode(values.email)}
                    disabled={disableButton || isSubmitting}
                    className="inline-flex items-center justify-center rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {disableButton ? t('registerForm.resendCode', { countdown }) : t('registerForm.getCode')}
                  </button>
                </div>
                {touched.email && errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="register-verification-code" className="text-sm font-medium text-foreground">
                  {t('publicAuth.fields.verificationCode')}
                </label>
                <input
                  id="register-verification-code"
                  type="text"
                  name="verification_code"
                  value={values.verification_code || ''}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  className={cn(
                    inputClassName,
                    touched.verification_code && errors.verification_code && 'border-destructive ring-2 ring-destructive/20'
                  )}
                  placeholder={t('publicAuth.fields.verificationCode')}
                />
                {touched.verification_code && errors.verification_code ? (
                  <p className="text-sm text-destructive">{errors.verification_code}</p>
                ) : null}
              </div>
            </>
          ) : null}

          {showInviteCode ? (
            <div className="space-y-2">
              <label htmlFor="register-invite-code" className="text-sm font-medium text-foreground">
                {t('publicAuth.fields.inviteCode')}
              </label>
              <input
                id="register-invite-code"
                type="text"
                name="invite_code"
                value={values.invite_code || ''}
                onBlur={handleBlur}
                onChange={handleChange}
                className={cn(inputClassName, touched.invite_code && errors.invite_code && 'border-destructive ring-2 ring-destructive/20')}
                placeholder={t('publicAuth.fields.inviteCode')}
              />
              {touched.invite_code && errors.invite_code ? <p className="text-sm text-destructive">{errors.invite_code}</p> : null}
            </div>
          ) : null}

          {errors.submit ? <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.submit}</p> : null}

          {turnstileEnabled ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-background p-2">
              <Turnstile sitekey={turnstileSiteKey} onVerify={(token) => setTurnstileToken(token)} />
            </div>
          ) : null}

          <button type="submit" disabled={isSubmitting} className={buttonClassName}>
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            <span>{isSubmitting ? t('registerForm.registering') : t('menu.signup')}</span>
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {t('registerPage.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              {t('menu.login')}
            </Link>
          </p>
        </form>
      )}
    </Formik>
  );
};

export default PublicRegisterForm;
