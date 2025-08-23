
import { User, Transaction, JWTTokenResponse, TwoFactorRequiredResponse, KycStatusResponse, WithdrawalRequest, KycRequest, AdminStats } from '../types';

const API_BASE_URL = 'https://optivlivebackend.onrender.com'; // Assuming the API is on the same domain

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function apiRequest<T>(
    endpoint: string,
    method: HttpMethod,
    body?: any,
    isMultipart: boolean = false
): Promise<T> {
    const headers: HeadersInit = {};
    
    if (!isMultipart && body) {
        headers['Content-Type'] = 'application/json';
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = isMultipart ? body : JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unexpected error occurred.' }));
        const errorMessage = errorData.detail || errorData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
    }

    if (response.status === 204) { // No Content
        return null as T;
    }

    return response.json();
}

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

export const login = (email: string, password: string): Promise<JWTTokenResponse | TwoFactorRequiredResponse> => 
    apiRequest(`/users/login/`, 'POST', { email, password });

export const verifyTwoFactor = (userId: string, token: string): Promise<JWTTokenResponse> =>
    apiRequest(`/users/2fa/verify/`, 'POST', { user_id: userId, token });

export const register = (data: Omit<any, 'confirmPassword'>): Promise<User> =>
    apiRequest(`/users/register/`, 'POST', {
        email: data.email,
        username: data.username,
        password: data.password,
        referred_by: data.referralCode // Assuming backend can resolve code to user ID.
    });
    
export const getProfile = (): Promise<User> => apiRequest('/users/profile/', 'GET');

export const requestPinResetToken = (email: string): Promise<{ detail: string }> =>
    apiRequest('/users/pin/request-token/', 'POST', { email });
    
export const setPin = (email: string, token: string, pin: string): Promise<{ detail: string }> =>
    apiRequest('/users/pin/set/', 'POST', { email, token, pin });

export const verifyPin = (email: string, pin: string): Promise<{ detail: string }> =>
    apiRequest('/users/pin/verify/', 'POST', { email, pin });

// --- KYC ---

export const submitKyc = (formData: FormData): Promise<{ id: string, status: string }> =>
    apiRequest('/kyc/submit/', 'POST', formData, true);
    
export const getKycStatus = (): Promise<KycStatusResponse> => apiRequest('/kyc/status/', 'GET');

// --- Transactions ---

export const listTransactions = (): Promise<Transaction[]> => apiRequest('/transactions/', 'GET');
export const getTransaction = (id: string): Promise<Transaction> => apiRequest(`/transactions/${id}/`, 'GET');

// --- Withdrawals ---

export const createWithdrawal = (data: { amount: string, bank_name: string, account_number: string, account_name: string }): Promise<{id: string, status: string}> =>
    apiRequest('/withdrawals/', 'POST', data);
    
export const listWithdrawals = (): Promise<WithdrawalRequest[]> => apiRequest('/withdrawals/', 'GET');

// --- Admin Endpoints ---
// These would typically be in a separate adminApi.ts file, but keeping it simple here.

export const adminListUsers = (): Promise<User[]> => apiRequest('/admin/users/', 'GET'); // Assuming endpoint exists
export const adminUpdateUser = (userId: string, data: Partial<User>): Promise<{ user: User }> => apiRequest(`/admin/users/${userId}/`, 'PATCH', data); // Assuming endpoint exists
export const adminCreateUser = (data: any): Promise<{ user: User }> => apiRequest(`/admin/users/create/`, 'POST', data); // Assuming endpoint exists

export const adminListWithdrawals = (): Promise<WithdrawalRequest[]> => apiRequest('/withdrawals/', 'GET'); // The backend docs imply GET /withdrawals/ is role-based
export const adminApproveWithdrawal = (id: string): Promise<{ message: string, status: string }> => apiRequest(`/withdrawals/admin/approve/${id}/`, 'POST');
export const adminDenyWithdrawal = (id: string, reason: string): Promise<{ message: string, status: string, reason: string }> => apiRequest(`/withdrawals/admin/deny/${id}/`, 'POST', { reason });

export const adminListKycRequests = (): Promise<KycRequest[]> => apiRequest('/kyc/admin/list/', 'GET'); // Assuming endpoint exists
export const adminProcessKyc = (userId: string, action: 'approve' | 'reject', reason?: string): Promise<{ success: boolean }> => apiRequest(`/kyc/admin/process/`, 'POST', { userId, action, reason }); // Assuming endpoint exists


// --- Mocked Functions for features without backend endpoints ---
// These are kept to prevent the UI from breaking completely. They should be replaced with real endpoints.

const simulateRequest = <T,>(data: T, delay = 500): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};

export const mockFetchDashboardStats = () => simulateRequest({ totalEarnings: 1250.75, totalTeamSize: 42, directReferrals: 7 });
export const mockFetchTeamTree = () => simulateRequest([]);
export const mockSubmitContactForm = (data: any) => {
    console.log("Contact form submitted:", data);
    return simulateRequest({ success: true, message: 'Your message has been received.' });
};

export const mockForgotPassword = (email: string) => {
    console.log(`Password reset requested for ${email}`);
    return simulateRequest({ message: 'If an account with that email exists, a password reset link has been sent.' });
};

export const mockResetPassword = (token: string, password: string) => {
    console.log(`Password reset with token ${token}`);
    return simulateRequest({ message: 'Your password has been reset successfully.' });
};

export const mockFetchAdminStats = (): Promise<AdminStats> => {
    return simulateRequest({
        totalUsers: 152,
        totalUserReferralEarnings: 45203.50,
        pendingWithdrawalsCount: 2,
        protocolBalance: 250140.75
    });
};

const MOCK_USERS: User[] = [
    { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', username: 'johndoe', balance: '1250.50', status: 'active', withdrawalStatus: 'active', referral_code: 'JOHN123', is_kyc_verified: true, role: 'user' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', username: 'janesmith', balance: '540.00', status: 'active', withdrawalStatus: 'active', referral_code: 'JANE456', is_kyc_verified: false, role: 'user' },
    { id: '3', firstName: 'Peter', lastName: 'Jones', email: 'peter.jones@example.com', username: 'peterj', balance: '0.00', status: 'frozen', withdrawalStatus: 'paused', referral_code: 'PETER789', is_kyc_verified: false, role: 'user' },
    { id: '4', firstName: 'Mary', lastName: 'Jane', email: 'mary.jane@example.com', username: 'maryjane', balance: '8321.10', status: 'active', withdrawalStatus: 'active', referral_code: 'MARY101', is_kyc_verified: true, role: 'user' },
];

export const mockFetchAllUsers = (): Promise<User[]> => simulateRequest(MOCK_USERS);

export const mockAdminUpdateUser = (userId: string, data: Partial<User>): Promise<{ user: User }> => {
    console.log(`Updating user ${userId} with`, data);
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...data };
        return simulateRequest({ user: MOCK_USERS[userIndex] });
    }
    return Promise.reject(new Error("User not found"));
};

export const mockAdminCreateUser = (data: any): Promise<{ user: User }> => {
    console.log(`Creating user with`, data);
    const newUser: User = {
        id: `user-${Date.now()}`,
        email: data.email,
        username: data.username,
        referral_code: `REF${Date.now()}`,
        is_kyc_verified: false,
        firstName: data.firstName,
        lastName: data.lastName,
        balance: '0',
        hasPin: false,
        is2faEnabled: false,
        role: 'user',
        status: 'active',
        withdrawalStatus: 'active'
    };
    MOCK_USERS.push(newUser);
    return simulateRequest({ user: newUser });
};

const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 't1', user: { name: 'John Doe', email: 'john.doe@example.com' }, tx_type: 'deposit', reference: 'Initial Deposit', amount: '1000.00', created_at: '2023-10-01T10:00:00Z', status: 'completed' },
    { id: 't2', user: { name: 'Jane Smith', email: 'jane.smith@example.com' }, tx_type: 'withdrawal', reference: 'Weekly Payout', amount: '-200.00', created_at: '2023-10-02T11:00:00Z', status: 'pending' },
    { id: 't3', user: { name: 'Peter Jones', email: 'peter.jones@example.com' }, tx_type: 'commission', reference: 'Referral Bonus', amount: '50.00', created_at: '2023-10-03T12:00:00Z', status: 'completed' },
    { id: 't4', user: { name: 'Mary Jane', email: 'mary.jane@example.com' }, tx_type: 'fee', reference: 'Service Fee', amount: '-5.00', created_at: '2023-10-04T13:00:00Z', status: 'completed' },
];

export const mockFetchAllTransactions = (page: number, limit = 10): Promise<{ transactions: Transaction[], totalPages: number }> => {
    const totalPages = Math.ceil(MOCK_TRANSACTIONS.length / limit);
    const transactions = MOCK_TRANSACTIONS.slice((page - 1) * limit, page * limit);
    return simulateRequest({ transactions, totalPages });
};

let MOCK_WITHDRAWALS: WithdrawalRequest[] = [
    { id: 'w1', userId: '1', userName: 'John Doe', userEmail: 'john.doe@example.com', amount: '150.00', date: '2023-10-26', status: 'pending', bank_name: 'Example Bank', account_number: '...1234', account_name: 'John Doe' },
    { id: 'w2', userId: '4', userName: 'Mary Jane', userEmail: 'mary.jane@example.com', amount: '500.00', date: '2023-10-25', status: 'pending', bank_name: 'Another Bank', account_number: '...5678', account_name: 'Mary Jane' },
];
export const mockFetchPendingWithdrawals = (): Promise<WithdrawalRequest[]> => simulateRequest(MOCK_WITHDRAWALS);
export const mockProcessWithdrawal = (id: string, action: 'approve' | 'deny'): Promise<{ success: boolean }> => {
    console.log(`Processing withdrawal ${id} with action: ${action}`);
    MOCK_WITHDRAWALS = MOCK_WITHDRAWALS.filter(w => w.id !== id);
    return simulateRequest({ success: true });
};

let MOCK_KYC_REQUESTS: KycRequest[] = [
    { id: 'k1', userId: '2', userName: 'Jane Smith', userEmail: 'jane.smith@example.com', dateSubmitted: '2023-10-20', address: '123 Fake St', city: 'Faketown', postalCode: '12345', country: 'UK', documentUrl: '#' },
];
export const mockFetchPendingKycRequests = (): Promise<KycRequest[]> => simulateRequest(MOCK_KYC_REQUESTS);
export const mockProcessKyc = (userId: string, action: 'approve' | 'reject', reason?: string): Promise<{ success: boolean }> => {
    console.log(`Processing KYC for ${userId} with action: ${action}, reason: ${reason}`);
    MOCK_KYC_REQUESTS = MOCK_KYC_REQUESTS.filter(k => k.userId !== userId);
    return simulateRequest({ success: true });
};
