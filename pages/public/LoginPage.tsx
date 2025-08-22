
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { validateEmail, validateInput } from '../../services/api';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput';


export const LoginPage: React.FC = () => {
  const { login, verifyTwoFactor } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [userIdFor2fa, setUserIdFor2fa] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Input validation
      validateEmail(email);
      validateInput(password, 'Password');

      const result = await login(email, password);
      if (result && result.twoFactorRequired && result.userId) {
        setUserIdFor2fa(result.userId);
        setStep('2fa');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        validateInput(twoFactorToken, '2FA Token');
        await verifyTwoFactor(userIdFor2fa, twoFactorToken);
        navigate('/dashboard');
    } catch (err: any) {
        setError(err.message || 'Failed to verify 2FA token.');
    } finally {
        setIsLoading(false);
    }
  }
  
  const inputClasses = "bg-white/10 backdrop-blur-sm border-white/20 rounded-full py-3 px-5 focus:bg-white/20 w-full";

  return (
    <AuthLayout
        title={t('loginPage.title')}
        subtitle={t('loginPage.subtitle')}
    >
        <div className="w-full">
            {step === 'credentials' && (
                <div className="w-full">
                    {error && <div className="bg-error/10 border border-error text-error p-3 rounded-md text-sm mb-6 max-w-lg mx-auto">{error}</div>}
                    
                    <form onSubmit={handleLogin}>
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-x-8 gap-y-6">
                            
                            <div className="text-center lg:text-left flex-shrink-0">
                                <h2 className="text-3xl font-bold">{t('loginPage.buttons.login')}</h2>
                                <p className="text-brand-light-gray/80 mt-1">
                                    {t('loginPage.subtitle')}
                                </p>
                            </div>

                            <div className="w-full max-w-md">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        placeholder={t('loginPage.form.email')}
                                        id="login-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className={inputClasses}
                                        aria-label="Email Address"
                                    />
                                    <PasswordInput
                                        id="login-password"
                                        placeholder={t('loginPage.form.password')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className={inputClasses}
                                        containerClassName="relative"
                                    />
                                    <div className="col-span-1 sm:col-span-2">
                                        <Button type="submit" size="lg" className="w-full !rounded-full !text-lg" isLoading={isLoading}>
                                            {t('loginPage.buttons.login')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                         <Link
                            to="/forgot-password"
                            className="text-sm text-brand-light-gray/80 hover:text-brand-secondary underline mt-6 inline-block"
                        >
                            {t('loginPage.forgotPassword')}
                        </Link>
                    </form>
                     <div className="text-center text-sm text-brand-light-gray mt-8 space-y-2">
                        <p>
                            {t('loginPage.noAccount')}<Link to="/signup" className="font-semibold text-brand-secondary hover:underline">{t('loginPage.signUp')}</Link>
                        </p>
                        <p className="pt-2">
                            {t('loginPage.areYouAdmin')}<Link to="/admin-login" className="font-semibold text-brand-secondary hover:underline">{t('loginPage.adminLogin')}</Link>
                        </p>
                    </div>
                </div>
            )}
            {step === '2fa' && (
                 <form onSubmit={handle2faSubmit} className="max-w-sm mx-auto space-y-6 bg-brand-panel/50 backdrop-blur-md border border-brand-ui-element/30 p-8 rounded-2xl">
                    <h3 className="text-xl font-semibold text-brand-white">{t('loginPage.2fa.title')}</h3>
                    <p className="text-brand-light-gray">{t('loginPage.2fa.subtitle')}</p>
                    {error && <div className="bg-error/10 border border-error text-error p-3 rounded-md text-sm">{error}</div>}
                    <Input
                        label={t('loginPage.2fa.label')}
                        id="2fa-token"
                        type="text"
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value)}
                        required
                        maxLength={6}
                        className={inputClasses}
                        aria-label={t('loginPage.2fa.label')}
                    />
                    <Button type="submit" className="w-full !rounded-full" isLoading={isLoading}>{t('loginPage.buttons.verify')}</Button>
                </form>
            )}
        </div>
    </AuthLayout>
  );
};
