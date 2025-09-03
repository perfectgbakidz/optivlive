

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../../../components/ui/StatCard';
import { Spinner } from '../../../components/ui/Spinner';
import * as api from '../../../services/api';
import { AdminStats, User } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { Modal } from '../../../components/layout/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { AccordionItem } from '../../../components/ui/Accordion';

const SettingsCard: React.FC<{title: string, children: React.ReactNode, footer?: React.ReactNode}> = ({title, children, footer}) => (
    <div className="bg-brand-panel backdrop-blur-lg border border-brand-ui-element/20 rounded-lg flex flex-col">
        <div className="p-6 flex-grow">
            <h2 className="text-xl font-semibold text-white border-b border-brand-ui-element/50 pb-3 mb-4">{title}</h2>
            {children}
        </div>
        {footer && <div className="bg-brand-dark/30 px-6 py-3 border-t border-brand-ui-element/20 rounded-b-lg">{footer}</div>}
    </div>
);

const AdminWithdrawalForm: React.FC<{ balance: string; onSuccess: () => void; }> = ({ balance, onSuccess }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        amount: '',
        bank_name: '',
        account_number: '',
        account_name: ''
    });
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [needsPinVerification, setNeedsPinVerification] = useState(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVerifyPin = async () => {
        setError('');
        setIsLoading(true);
        try {
            await api.verifyPin(pin);
            setNeedsPinVerification(false);
            setMessage("PIN verified successfully. You can now submit your withdrawal.");
        } catch (err: any) {
            setError(err.message || 'PIN verification failed.');
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const withdrawalAmount = parseFloat(formData.amount);
        const availableBalance = parseFloat(balance);

        if (withdrawalAmount <= 0) {
            setError('Withdrawal amount must be positive.');
            return;
        }

        if (withdrawalAmount > availableBalance) {
            setError('Withdrawal amount cannot exceed your available balance.');
            return;
        }

        setIsLoading(true);
        try {
            await api.createWithdrawal({
                ...formData,
                amount: withdrawalAmount.toFixed(2),
            });
            setMessage('Withdrawal request submitted successfully.');
            setFormData({ amount: '', bank_name: '', account_number: '', account_name: '' });
            setPin('');
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Withdrawal failed.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (needsPinVerification) {
        return (
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">{t('dashboard.withdraw.form.pinLabel')}</h3>
                <p className="text-sm text-brand-light-gray">For your security, please verify your PIN to proceed with the withdrawal.</p>
                {message && <div className="text-success p-2 rounded bg-success/10 border border-success">{message}</div>}
                {error && <div className="text-error p-2 rounded bg-error/10 border border-error">{error}</div>}
                <Input label="PIN" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder={t('dashboard.withdraw.form.pinPlaceholder')} required maxLength={6} />
                <Button onClick={handleVerifyPin} className="w-full" isLoading={isLoading}>Verify PIN</Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Withdrawal Details</h3>
            {message && <div className="text-success p-2 rounded bg-success/10 border border-success">{message}</div>}
            {error && <div className="text-error p-2 rounded bg-error/10 border border-error">{error}</div>}
            
            <Input label={t('dashboard.withdraw.form.amountLabel')} name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} placeholder="0.00" required />
            <Input label="Bank Name" name="bank_name" type="text" value={formData.bank_name} onChange={handleInputChange} placeholder="e.g., Bank of Example" required />
            <Input label="Account Number" name="account_number" type="text" value={formData.account_number} onChange={handleInputChange} placeholder="e.g., 1234567890" required />
            <Input label="Account Name" name="account_name" type="text" value={formData.account_name} onChange={handleInputChange} placeholder="e.g., John Doe" required />

            <Button type="submit" className="w-full" isLoading={isLoading}>{t('dashboard.withdraw.form.button')}</Button>
        </form>
    );
};


export const AdminOverviewTab: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [areWithdrawalsPaused, setAreWithdrawalsPaused] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const statsData = await api.getAdminStats();
                setStats(statsData);
            } catch (err: any) {
                setError(err.message || 'Failed to load admin data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <Spinner />;
    if (error) return <div className="text-error text-center p-4">{error}</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">{t('admin.overview.title')}</h1>

            {/* Screen 1: User-like View for Master Account */}
            <div className="bg-brand-panel backdrop-blur-lg border border-brand-ui-element/20 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-4">{t('admin.overview.masterDashboardTitle')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title={t('admin.overview.myRefEarnings')} 
                        value={`£${(stats?.adminReferralEarnings ?? 0).toFixed(2)}`}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                    />
                    <StatCard 
                        title={t('admin.overview.balance')} 
                        value={`£${parseFloat(user?.balance || '0').toFixed(2)}`}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    />
                    <div className="bg-brand-dark p-6 rounded-lg flex flex-col items-center justify-center text-center">
                        <p className="font-semibold">{t('admin.overview.withdrawalsCard.title')}</p>
                        <p className="text-sm text-brand-light-gray mt-2">{t('admin.overview.withdrawalsCard.subtitle')}</p>
                        <div className="flex flex-col space-y-2 mt-4">
                            <Button onClick={() => setIsWithdrawModalOpen(true)}>{t('admin.overview.withdrawalsCard.withdraw_button')}</Button>
                            <button onClick={() => navigate('/admin/withdrawals')} className="text-brand-secondary hover:underline text-sm">{t('admin.overview.withdrawalsCard.manage_users_link')}</button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Screen 2: Admin-specific View */}
            <div>
                 <h2 className="text-2xl font-bold text-white mb-4">{t('admin.overview.platformControlsTitle')}</h2>
                 <div className="space-y-6">
                    {/* Main Balance Displays */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-brand-panel backdrop-blur-lg border-2 border-brand-primary/50 p-6 rounded-xl shadow-2xl shadow-brand-primary/10 text-center flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-brand-light-gray">{t('admin.overview.totalUserEarnings')}</h2>
                                <p className="text-5xl font-extrabold text-brand-white my-4">£{(stats?.totalUserReferralEarnings ?? 0).toFixed(2)}</p>
                            </div>
                            <p className="text-sm text-brand-ui-element mt-2">{t('admin.overview.totalUserEarningsDesc')}</p>
                        </div>
                        <div className="bg-brand-panel backdrop-blur-lg border-2 border-success/50 p-6 rounded-xl shadow-2xl shadow-success/10 text-center flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-brand-light-gray">{t('admin.overview.protocolBalance')}</h2>
                                <p className="text-5xl font-extrabold text-success my-4">£{(stats?.protocolBalance ?? 0).toFixed(2)}</p>
                            </div>
                            <p className="text-sm text-brand-ui-element mt-2">{t('admin.overview.protocolBalanceDesc')}</p>
                        </div>
                    </div>

                    {/* Secondary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                         <StatCard 
                            title={t('admin.overview.totalUsers')} 
                            value={stats?.totalUsers || 0}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        />
                         <StatCard 
                            title={t('admin.overview.pendingWithdrawals')} 
                            value={stats?.pendingWithdrawalsCount || 0}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        />
                        <SettingsCard title={t('admin.overview.masterAccountCard.title')}>
                             <p className="text-sm text-brand-light-gray">{t('admin.overview.masterAccountCard.desc')}</p>
                             <div className="mt-3 font-mono text-xs space-y-1">
                                <p><span className="font-bold text-brand-light-gray">{t('admin.overview.masterAccountCard.username')}</span> master</p>
                                <p><span className="font-bold text-brand-light-gray">{t('admin.overview.masterAccountCard.refCode')}</span> MASTERKEY</p>
                            </div>
                        </SettingsCard>
                        <SettingsCard title={t('admin.overview.globalWithdrawalsCard.title')}>
                            <div className="flex items-center justify-between">
                                <div className="flex-grow">
                                     <p className="font-semibold text-brand-white">{t('admin.overview.globalWithdrawalsCard.allUserWithdrawals')}</p>
                                      <p className={`text-sm ${areWithdrawalsPaused ? 'text-warning' : 'text-success'}`}>
                                        {areWithdrawalsPaused ? t('common.status.paused') : t('common.status.active')}
                                      </p>
                                </div>
                                <button onClick={() => setAreWithdrawalsPaused(!areWithdrawalsPaused)} aria-label="Toggle all withdrawals">
                                    <div className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors ${areWithdrawalsPaused ? 'bg-warning' : 'bg-success'}`}>
                                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${areWithdrawalsPaused ? 'translate-x-0' : 'translate-x-6'}`}></div>
                                    </div>
                                </button>
                            </div>
                             <p className="text-xs text-brand-ui-element mt-3">{t('admin.overview.globalWithdrawalsCard.desc')}</p>
                        </SettingsCard>
                    </div>
                 </div>
            </div>
            
            {/* Metrics Explanation Section */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">{t('admin.overview.metricsExplainedTitle')}</h2>
                <div className="bg-brand-panel backdrop-blur-lg border border-brand-ui-element/20 rounded-lg shadow-lg p-2">
                    <AccordionItem title={t('admin.overview.metrics.myEarningsTitle')}>
                        <p>{t('admin.overview.metrics.myEarningsDesc')}</p>
                    </AccordionItem>
                    <AccordionItem title={t('admin.overview.metrics.myBalanceTitle')}>
                        <p>{t('admin.overview.metrics.myBalanceDesc')}</p>
                    </AccordionItem>
                    <AccordionItem title={t('admin.overview.metrics.totalUserEarningsTitle')}>
                         <p>{t('admin.overview.metrics.totalUserEarningsDesc')}</p>
                    </AccordionItem>
                     <AccordionItem title={t('admin.overview.metrics.protocolBalanceTitle')}>
                         <p>{t('admin.overview.metrics.protocolBalanceDesc')}</p>
                    </AccordionItem>
                </div>
            </div>

            <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title="Withdraw Your Balance">
                {user?.is_kyc_verified ? (
                     <AdminWithdrawalForm 
                        balance={user.balance || '0'}
                        onSuccess={() => {
                            setTimeout(() => {
                                setIsWithdrawModalOpen(false);
                                // A proper app would refetch the user's balance here
                            }, 2000);
                        }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-warning mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <h3 className="text-xl font-semibold text-white">{t('dashboard.withdraw.kyc.title')}</h3>
                        <p className="text-brand-light-gray mt-2">Please ensure your account has passed KYC verification to enable withdrawals.</p>
                    </div>
                )}
            </Modal>
        </div>
    );
};