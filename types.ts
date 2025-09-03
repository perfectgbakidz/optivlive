// --- API & Base Types ---

export interface JWTTokenResponse {
  refresh: string;
  access: string;
}

export interface TwoFactorRequiredResponse {
    two_factor_required: true;
    user_id: string;
}

export interface Generate2FAResponse {
    secret_key: string;
    qr_code_url: string;
}

// --- User Types ---

export interface User {
  id: string;
  email: string;
  username: string;
  referral_code: string;
  is_kyc_verified: boolean;
  // --- Fields assumed to exist for UI functionality ---
  firstName?: string;
  lastName?: string;
  balance?: string;
  hasPin?: boolean;
  is2faEnabled?: boolean;
  role?: 'user' | 'admin';
  status?: 'active' | 'frozen';
  withdrawalStatus?: 'active' | 'paused';
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ twoFactorRequired: boolean, userId?: string } | void>;
  adminLogin: (email: string, pass: string) => Promise<{ twoFactorRequired: boolean, userId?: string } | void>;
  verifyTwoFactor: (userId: string, token: string) => Promise<User>;
  isAwaiting2FA: boolean;
  isAdmin: boolean;
  logout: () => void;
  signup: (details: any) => Promise<void>;
  updateUser: (newUser: Partial<User>) => void;
}

// --- Dashboard & Transaction Types ---

export interface DashboardStats {
  totalEarnings: number;
  totalTeamSize: number;
  directReferrals: number;
}

export interface DownlineLevel {
  level: number;
  users: number;
  earnings: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  created_at: string;
  type: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  user?: { 
    name: string;
    email: string;
  };
}

export interface TeamMember {
  id: number;
  username: string;
  email: string;
  referral_code: string;
  children: TeamMember[];
}

// --- KYC Types ---

export interface KycStatusResponse {
    status: 'unverified' | 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    user_id?: number;
    submitted_at?: string | null;
    reviewed_at?: string | null;
}

export interface KycRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    dateSubmitted: string;
    // Backend review fields
    decision?: 'approved' | 'rejected';
    rejection_reason?: string | null;
    // If backend provides documents as URLs or file keys
    documentUrl?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}

// --- Admin Types ---

export interface AdminStats {
    totalUsers: number;
    totalUserReferralEarnings: number;
    adminReferralEarnings: number;
    pendingWithdrawalsCount: number;
    protocolBalance: number;
}

export interface WithdrawalRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    bank_name: string;
    account_number: string;
    account_name: string;
}
