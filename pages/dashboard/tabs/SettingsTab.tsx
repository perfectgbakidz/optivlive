
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import * as api from '../../../services/api';
import { Modal } from '../../../components/layout/Modal';

const SettingsCard: React.FC<{title: string, children: React.ReactNode, footer?: React.ReactNode}> = ({title, children, footer}) => (
    <div className="bg-brand-panel backdrop-blur-lg border border-brand-ui-element/20 rounded-lg flex flex-col">
        <div className="p-6 flex-grow">
            <h2 className="text-xl font-semibold text-white border-b border-brand-ui-element/50 pb-3 mb-4">{title}</h2>
            {children}
        </div>
        {footer && <div className="bg-brand-dark/30 px-6 py-3 border-t border-brand-ui-element/20 rounded-b-lg">{footer}</div>}
    </div>
);

const ProfileInfo: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setError('');
        try {
            // Note: The backend docs don't specify an endpoint for updating profile names.
            // This uses a mock/assumed endpoint and should be verified.
            // await api.updateProfile({ firstName, lastName });
            updateUser({ firstName, lastName });
            setMessage(t('dashboard.settings.profile.success'));
        } catch (err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <form onSubmit={handleProfileUpdate} className="space-y-4">
            {message && <div className="text-success p-2 rounded bg-success/10 border border-success">{message}</div>}
            {error && <div className="text-error p-2 rounded bg-error/10 border border-error">{error}</div>}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t('dashboard.settings.profile.firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} />
                <Input label={t('dashboard.settings.profile.lastName')} value={lastName} onChange={e => setLastName(e.target.value)} />
             </div>
             <Input label={t('dashboard.settings.profile.email')} value={user?.email || ''} readOnly />
             <Button type="submit" isLoading={isLoading} variant="secondary">{t('dashboard.settings.profile.button')}</Button>
        </form>
    )
}

const ChangePassword = () => {
    // Note: No backend endpoint for password change was documented. This remains a mock.
    const { logout } = useAuth();
    const { t } = useTranslation();
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: ''});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setPasswords({...passwords, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(passwords.new !== passwords.confirm) {
            setError(t('forms.errors.passwordsDoNotMatch'));
            return;
        }
        setError('');
        setMessage('This is a mock. Password change endpoint is not defined in the backend docs.');
        setIsLoading(false);
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div className="text-success p-2 rounded bg-success/10 border border-success">{message}</div>}
            {error && <div className="text-error p-2 rounded bg-error/10 border border-error">{error}</div>}
            <Input label={t('dashboard.settings.password.current')} name="current" type="password" value={passwords.current} onChange={handleChange} required/>
            <Input label={t('dashboard.settings.password.new')} name="new" type="password" value={passwords.new} onChange={handleChange} required/>
            <Input label={t('dashboard.settings.password.confirm')} name="confirm" type="password" value={passwords.confirm} onChange={handleChange} required/>
            <Button type="submit" isLoading={isLoading} variant="secondary">{t('dashboard.settings.password.button')}</Button>
        </form>
    )
}

const ManagePin = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [step, setStep] = useState<'initial' | 'verify'>('initial');
    const [pin, setPin] = useState({ new: '', confirm: ''});
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => setPin({...pin, [e.target.name]: e.target.value });

    const handleSendToken = async () => {
        if(pin.new.length < 4 || pin.new.length > 6) {
             setError(t('dashboard.settings.pin.errorLength'));
             return;
        }
        if (pin.new !== pin.confirm) {
            setError(t('dashboard.settings.pin.errorMatch'));
            return;
        }
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            const res = await api.requestPinResetToken(user!.email);
            setMessage(res.detail);
            setStep('verify');
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSetPin = async () => {
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            const res = await api.setPin(user!.email, token, pin.new);
            setMessage(res.detail);
            updateUser({ hasPin: true });
            setStep('initial');
            setPin({new: '', confirm: ''});
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    if (user?.hasPin) {
        return <p className="text-brand-light-gray">{t('dashboard.settings.pin.isSet')}</p>
    }

    return (
        <div className="space-y-4">
             {message && <div className="text-success p-2 rounded bg-success/10 border border-success">{message}</div>}
             {error && <div className="text-error p-2 rounded bg-error/10 border border-error">{error}</div>}
             {step === 'initial' && (
                <div className="space-y-4">
                    <Input label={t('dashboard.settings.pin.newPin')} name="new" type="password" maxLength={6} value={pin.new} onChange={handlePinChange} />
                    <Input label={t('dashboard.settings.pin.confirmPin')} name="confirm" type="password" maxLength={6} value={pin.confirm} onChange={handlePinChange} />
                    <Button onClick={handleSendToken} isLoading={isLoading}>{t('dashboard.settings.pin.buttonSet')}</Button>
                </div>
             )}
             {step === 'verify' && (
                <div className="space-y-4">
                    <Input label={t('dashboard.settings.pin.emailCode')} type="text" value={token} onChange={e => setToken(e.target.value)} />
                    <Button onClick={handleSetPin} isLoading={isLoading}>{t('dashboard.settings.pin.buttonConfirm')}</Button>
                </div>
             )}
        </div>
    )
}

const Manage2FA = () => {
    // Note: Backend documentation does not specify 2FA management endpoints. This remains a mock.
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<'enable' | 'disable' | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEnableClick = async () => {
        setError("This is a mock. 2FA management endpoints are not defined in the backend docs.");
    };

    const handleDisableClick = () => {
        setError("This is a mock. 2FA management endpoints are not defined in the backend docs.");
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
    }

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-brand-light-gray">{t('dashboard.settings.2fa.description')}</p>
                    <button onClick={user?.is2faEnabled ? handleDisableClick : handleEnableClick} disabled={isLoading}>
                        <div className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${user?.is2faEnabled ? 'bg-success' : 'bg-brand-ui-element'}`}>
                            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${user?.is2faEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </button>
                </div>
                {error && <p className="text-sm text-error">{error}</p>}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={t(modalContent === 'enable' ? 'dashboard.settings.2fa.enableModalTitle' : 'dashboard.settings.2fa.disableModalTitle')}>
                {/* Modal content is removed as it's a non-functional mock */}
            </Modal>
        </>
    );
};


export const SettingsTab: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">{t('dashboard.settings.title')}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    <SettingsCard title={t('dashboard.settings.profile.title')}><ProfileInfo /></SettingsCard>
                    <SettingsCard title={t('dashboard.settings.password.title')}><ChangePassword /></SettingsCard>
                </div>
                <div className="space-y-8">
                    <SettingsCard title={t('dashboard.settings.pin.title')}><ManagePin /></SettingsCard>
                    <SettingsCard title={t('dashboard.settings.2fa.title')}>
                        <Manage2FA />
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};
