
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
    const { adminLogin } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            validateEmail(email);
            validateInput(password, 'Password');
            await adminLogin(email, password);
            navigate('/admin');
        } catch(err: any) {
            setError(err.message || 'Failed to login as admin.');
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
        </div>
    </AuthLayout>
    );
};
