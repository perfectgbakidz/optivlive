import { 
    User, 
    Transaction, 
    JWTTokenResponse, 
    TwoFactorRequiredResponse, 
    KycStatusResponse, 
    WithdrawalRequest, 
    KycRequest, 
    AdminStats, 
    DashboardStats, 
    TeamMember, 
    Generate2FAResponse 
} from './types';

const API_BASE_URL = 'https://optivlivebackend.onrender.com';

const getAuthToken = (): string | null => localStorage.getItem('accessToken');

// Helper for JSON API calls
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { detail: response.statusText || 'An unknown API error occurred.' };
        }
        throw new Error(errorData.detail || errorData.message || 'An API error occurred.');
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }

    return response.json();
};

// Helper for FormData API calls (for file uploads)
const apiFetchFormData = async (endpoint: string, formData: FormData, method: 'POST' | 'PATCH' = 'POST') => {
    const token = getAuthToken();
    const headers: HeadersInit = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: formData,
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { detail: response.statusText || 'An unknown API error occurred.' };
        }
        throw new Error(errorData.detail || errorData.message || 'An API error occurred.');
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }
    
    return response.json();
};


// --- Validation Helpers ---
export const validateEmail = (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address.');
    }
};

export const validateInput = (input: string, fieldName: string) => {
    if (!input || input.trim() === '') {
        throw new Error(`${fieldName} cannot be empty.`);
    }
};

// --- Authentication & Users ---

export const login = (email: string, password: string): Promise<JWTTokenResponse | TwoFactorRequiredResponse> => {
    return apiFetch('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
};

export const verifyTwoFactor = (userId: string, token: string): Promise<JWTTokenResponse> => {
    return apiFetch('/auth/2fa/verify/', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, token }),
    });
};

export const register = (data: any): Promise<User> => {
    return apiFetch('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const getProfile = (): Promise<User> => {
    return apiFetch('/users/profile/');
};

export const updateProfile = (data: Partial<Pick<User, 'firstName' | 'lastName'>>): Promise<User> => {
    return apiFetch('/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};

export const changePassword = (data: any): Promise<void> => {
    return apiFetch('/users/change-password/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const requestPasswordReset = (email: string): Promise<void> => {
    return apiFetch('/auth/password/reset/', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

export const resetPassword = (token: string, password: string): Promise<void> => {
    return apiFetch('/auth/password/reset/confirm/', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
    });
};

// --- 2FA Management ---
export const generate2faSecret = (): Promise<Generate2FAResponse> => {
    return apiFetch('/users/2fa/generate/');
};

export const enable2fa = (token: string): Promise<void> => {
    return apiFetch('/users/2fa/enable/', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
};

export const disable2fa = (token: string): Promise<void> => {
    return apiFetch('/users/2fa/disable/', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
};

// --- PIN Management ---
export const setPin = (pin: string): Promise<{ detail: string }> => {
    return apiFetch('/users/set-pin/', {
        method: 'POST',
        body: JSON.stringify({ pin }),
    });
};

export const changePin = (data: { currentPassword: string, newPin: string }): Promise<{ detail: string }> => {
    return apiFetch('/users/change-pin/', {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};


export const verifyPin = (pin: string): Promise<{ detail: string }> => {
    return apiFetch('/users/verify-pin/', {
        method: 'POST',
        body: JSON.stringify({ pin }),
    });
};

// --- Dashboard ---
export const getDashboardStats = (): Promise<DashboardStats> => {
    return apiFetch('/dashboard/stats/');
};
export const getTeamTree = (): Promise<TeamMember[]> => {
    return apiFetch('/team/tree/');
};

// --- KYC ---
export const submitKyc = (formData: FormData): Promise<{ id: string, status: string }> => {
    return apiFetchFormData('/kyc/submit/', formData);
};
    
export const getKycStatus = (): Promise<KycStatusResponse> => {
    return apiFetch('/kyc/status/');
};

// --- Transactions ---
export const listTransactions = (): Promise<Transaction[]> => {
    return apiFetch('/transactions/');
};
export const getTransaction = (id: string): Promise<Transaction> => {
    return apiFetch(`/transactions/${id}/`);
};

// --- Withdrawals ---
export const createWithdrawal = (data: { amount: string, bank_name: string, account_number: string, account_name: string }): Promise<{id: string, status: string}> => {
    return apiFetch('/withdrawals/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};
    
export const listWithdrawals = (): Promise<WithdrawalRequest[]> => {
    return apiFetch('/withdrawals/');
};

// --- Admin Endpoints ---
export const getAdminStats = (): Promise<AdminStats> => {
    return apiFetch('/admin/stats/');
};
export const adminListUsers = (): Promise<User[]> => {
    return apiFetch('/admin/users/');
};
export const adminUpdateUser = (userId: string, data: Partial<User>): Promise<User> => {
    return apiFetch(`/admin/users/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
};
export const adminCreateUser = (data: any): Promise<User> => {
    return apiFetch('/admin/users/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};

export const adminListWithdrawals = (): Promise<WithdrawalRequest[]> => {
    return apiFetch('/admin/withdrawals/');
};
export const adminApproveWithdrawal = (id: string): Promise<{ message: string, status: string }> => {
    return apiFetch(`/admin/withdrawals/${id}/approve/`, { method: 'POST' });
};
export const adminDenyWithdrawal = (id: string, reason: string): Promise<{ message: string, status: string, reason: string }> => {
    return apiFetch(`/admin/withdrawals/${id}/deny/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
};

export const adminListKycRequests = (): Promise<KycRequest[]> => {
    return apiFetch('/admin/kyc/');
};

// ✅ FIXED to match backend schema
export const adminProcessKyc = (
    id: string,
    payload: { decision: 'approved' | 'rejected'; rejection_reason?: string }
): Promise<{ success: boolean }> => {
    return apiFetch(`/admin/kyc/${id}/process/`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const adminListTransactions = (): Promise<Transaction[]> => {
    return apiFetch('/admin/transactions/');
};

// --- Other ---
export const submitContactForm = (data: any): Promise<{ success: boolean, message: string }> => {
    return apiFetch('/contact/', {
        method: 'POST',
        body: JSON.stringify(data),
    });
};
