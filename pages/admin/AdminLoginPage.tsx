

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { validateEmail, validateInput } from '../../services/api';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput';

const inputClasses = "bg-white/10 backdrop-blur-sm border-white/20 rounded-full py-3 px-5 focus:bg-white/20 w-full";

export const AdminLoginPage: React.FC = () => {
    const { adminLogin, verifyTwoFactor, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const [userIdFor2fa, setUserIdFor2fa] = useState('');
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            validateEmail(email);
            validateInput(password, 'Password');
            const result = await adminLogin(email, password);
            // FIX: Add check for result before accessing properties to avoid type error
            if (result && result.twoFactorRequired && result.userId) {
                setUserIdFor2fa(result.userId);
                setStep('2fa');
            } else {
                navigate('/admin');
            }
        } catch(err: any) {
            setError(err.message || 'Failed to login as admin.');
        } finally {
            setIsLoading(false);
        }
    }
    
    const handle2faSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            validateInput(twoFactorToken, '2FA Token');
            const loggedInUser = await verifyTwoFactor(userIdFor2fa, twoFactorToken);
            if (loggedInUser && loggedInUser.role !== 'admin') {
                logout();
                throw new Error("Access denied. User is not an administrator.");
            }
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Failed to verify 2FA token.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
    <AuthLayout
      title={t('admin.loginPage.title')}
      subtitle={t('admin.loginPage.subtitle')}
      showSocials={false}
      footerText={t('admin.loginPage.footer')}
    >
        <div className="w-full max-w-md">
            {step === 'credentials' && (
                <form onSubmit={handleLogin} className="w-full space-y-6">
                     {error && <div className="bg-error/10 border border-error text-error p-3 rounded-md text-sm">{error}</div>}
                     <Input
                        placeholder={t('admin.loginPage.emailPlaceholder')}
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={inputClasses}
                        aria-label="Admin Email"
                    />
                    <PasswordInput
                        id="admin-password"
                        placeholder={t('admin.loginPage.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={inputClasses}
                    />
                    <Button type="submit" size="lg" className="w-full !rounded-full !text-lg" isLoading={isLoading}>
                        {t('admin.loginPage.button')}
                    </Button>
                    <Link to="/login" className="text-sm text-brand-light-gray/80 hover:text-brand-secondary underline mt-6 inline-block">
                        {t('admin.loginPage.return')}
                    </Link>
                </form>
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
