

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

const ChangePassword = () => {
    const { t } = useTranslation();
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: ''});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setPasswords({...passwords, [e.target.name]: e.target.value });
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(passwords.newPassword !== passwords.confirmPassword) {
            setError(t('forms.errors.passwordsDoNotMatch'));
            return;
        }
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            await api.changePassword({
                old_password: passwords.currentPassword,
                new_password: passwords.newPassword,
            });
            setMessage('Password changed successfully.');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: ''});
        } catch(err: any) {
            setError(err.message || 'Failed to change password.');
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div className="text-success p-2 rounded bg-success/10 border border-success">{message}</div>}
            {error && <div className="text-error p-2 rounded bg-error/10 border border-error">{error}</div>}
            <Input label={t('admin.settings.password.current')} name="currentPassword" type="password" value={passwords.currentPassword} onChange={handleChange} required/>
            <Input label={t('admin.settings.password.new')} name="newPassword" type="password" value={passwords.newPassword} onChange={handleChange} required/>
            <Input label={t('admin.settings.password.confirm')} name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={handleChange} required/>
            <Button type="submit" isLoading={isLoading} variant="secondary">{t('admin.settings.password.button')}</Button>
        </form>
    )
}

const ManagePin = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [pin, setPin] = useState({ new: '', confirm: '' });
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isChanging, setIsChanging] = useState(false);

    const handlePinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setPin({ ...pin, [e.target.name]: e.target.value });

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.new.length < 4 || pin.new.length > 6) {
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
            const res = await api.setPin(pin.new);
            setMessage(res.detail);
            updateUser({ hasPin: true });
            setPin({ new: '', confirm: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.new.length < 4 || pin.new.length > 6) {
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
            const res = await api.changePin({ currentPassword: password, newPin: pin.new });
            setMessage(res.detail);
            setPin({ new: '', confirm: '' });
            setPassword('');
            setIsChanging(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (user?.hasPin) {
        return (
            <div className="space-y-4">
                <p className="text-brand-light-gray">{t('dashboard.settings.pin.isSet')}</p>
                <Button variant="secondary" onClick={() => { setIsChanging(!isChanging); setError(''); setMessage(''); }}>
                    {isChanging ? t('admin.userDetailModal.cancel') : t('admin.settings.pin.changeButton')}
                </Button>

                {isChanging && (
                    <form onSubmit={handlePinChange} className="space-y-4 pt-4 border-t border-brand-ui-element/30">
                        {message && <div className="text-success p-2 rounded bg-success/10 border border-success text-sm">{message}</div>}
                        {error && <div className="text-error p-2 rounded bg-error/10 border border-error text-sm">{error}</div>}
                        <Input label={t('admin.settings.pin.currentPassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <Input label={t('dashboard.settings.pin.newPin')} name="new" type="password" maxLength={6} value={pin.new} onChange={handlePinInputChange} required />
                        <Input label={t('dashboard.settings.pin.confirmPin')} name="confirm" type="password" maxLength={6} value={pin.confirm} onChange={handlePinInputChange} required />
                        <Button type="submit" isLoading={isLoading}>{t('admin.settings.pin.saveButton')}</Button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSetPin} className="space-y-4">
            {message && <div className="text-success p-2 rounded bg-success/10 border border-success">{message}</div>}
            {error && <div className="text-error p-2 rounded bg-error/10 border border-error">{error}</div>}
            <Input label={t('dashboard.settings.pin.newPin')} name="new" type="password" maxLength={6} value={pin.new} onChange={handlePinInputChange} />
            <Input label={t('dashboard.settings.pin.confirmPin')} name="confirm" type="password" maxLength={6} value={pin.confirm} onChange={handlePinInputChange} />
            <Button type="submit" isLoading={isLoading}>{t('dashboard.settings.pin.buttonSet')}</Button>
        </form>
    );
};


const Manage2FA = () => {
    const { user, updateUser } = useAuth();
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<'enable' | 'disable' | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleEnableClick = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');
        try {
            const data = await api.generate2faSecret();
            setSecret(data.secret_key);
            setQrCodeUrl(data.qr_code_url);
            setModalContent('enable');
            setIsModalOpen(true);
        } catch (err: any) {
            setError(err.message || 'Failed to start 2FA setup.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisableClick = () => {
        setModalContent('disable');
        setIsModalOpen(true);
        setError('');
        setMessage('');
        setVerificationCode('');
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
        setError('');
        setVerificationCode('');
    };

    const handleVerifyAndEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await api.enable2fa(verificationCode);
            updateUser({ is2faEnabled: true });
            setMessage('2FA has been enabled successfully.');
            closeModal();
        } catch (err: any) {
            setError(err.message || 'Failed to enable 2FA. Please check the code and try again.');
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleVerifyAndDisable = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await api.disable2fa(verificationCode);
            updateUser({ is2faEnabled: false });
            setMessage('2FA has been disabled successfully.');
            closeModal();
        } catch (err: any) {
            setError(err.message || 'Failed to disable 2FA. Please check the code and try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const renderModalContent = () => {
        if (modalContent === 'enable') {
            return (
                <form onSubmit={handleVerifyAndEnable} className="space-y-4">
                    {error && <div className="text-error p-2 rounded bg-error/10 border border-error text-sm">{error}</div>}
                    <p className="text-sm text-brand-light-gray">{t('admin.settings.2fa.enableStep1')}</p>
                    <div className="bg-white p-2 rounded-lg inline-block mx-auto">
                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40"/>
                    </div>
                    <p className="text-sm text-brand-light-gray">{t('admin.settings.2fa.enableStep2')}</p>
                    <div className="bg-brand-dark p-2 rounded font-mono text-center text-brand-secondary break-all">{secret}</div>
                    <p className="text-sm text-brand-light-gray pt-2">{t('admin.settings.2fa.enableStep3')}</p>
                    <Input 
                        label={t('admin.settings.2fa.verificationCode')}
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t border-brand-ui-element/20">
                        <Button type="button" variant="outline" onClick={closeModal} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>{t('admin.settings.2fa.buttonVerifyEnable')}</Button>
                    </div>
                </form>
            )
        }
        if (modalContent === 'disable') {
            return (
                 <form onSubmit={handleVerifyAndDisable} className="space-y-4">
                    <p>{t('admin.settings.2fa.disablePrompt')}</p>
                    {error && <div className="text-error p-2 rounded bg-error/10 border border-error text-sm">{error}</div>}
                    <Input 
                        label={t('admin.settings.2fa.authCode')}
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                    />
                     <div className="flex justify-end gap-2 pt-4 border-t border-brand-ui-element/20">
                        <Button type="button" variant="outline" onClick={closeModal} disabled={isLoading}>Cancel</Button>
                        <Button type="submit" variant="danger" isLoading={isLoading}>{t('admin.settings.2fa.buttonVerifyDisable')}</Button>
                    </div>
                </form>
            )
        }
        return null;
    }

    return (
        <>
            <div className="space-y-4">
                {message && <div className="text-success p-2 rounded bg-success/10 border border-success text-sm">{message}</div>}
                <div className="flex items-center justify-between">
                    <p className="text-brand-light-gray">{t('admin.settings.2fa.description')}</p>
                    <button onClick={user?.is2faEnabled ? handleDisableClick : handleEnableClick} disabled={isLoading}>
                        <div className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${user?.is2faEnabled ? 'bg-success' : 'bg-brand-ui-element'}`}>
                            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${user?.is2faEnabled ? 'translate-x-6' : ''}`}></div>
                        </div>
                    </button>
                </div>
                {error && !isModalOpen && <p className="text-sm text-error">{error}</p>}
            </div>
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={t(modalContent === 'enable' ? 'admin.settings.2fa.enableModalTitle' : 'admin.settings.2fa.disableModalTitle')}>
                {renderModalContent()}
            </Modal>
        </>
    );
};


export const AdminSettingsTab: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">{t('admin.settings.title')}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <SettingsCard title={t('admin.settings.password.title')}><ChangePassword /></SettingsCard>
                <SettingsCard title={t('admin.settings.2fa.title')}>
                    <Manage2FA />
                </SettingsCard>
                 <SettingsCard title={t('dashboard.settings.pin.title')}><ManagePin /></SettingsCard>
            </div>
        </div>
    );
};