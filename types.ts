
// --- API & Base Types ---

export interface JWTTokenResponse {
  refresh: string;
  access: string;
}

export interface TwoFactorRequiredResponse {
    two_factor_required: true;
    user_id: string;
}

// --- User Types ---

export interface User {
  id: string;
  email: string;
  username: string;
  referral_code: string;
  is_kyc_verified: boolean;
  // --- Fields assumed to exist for UI functionality ---
  firstName?: string; // Not in docs, but used in UI. Assumed part of profile.
  lastName?: string; // Not in docs, but used in UI. Assumed part of profile.
  balance?: string; // Not in docs, but critical for UI. Assumed part of profile.
  hasPin?: boolean; // Not in docs, but state needed for UI.
  is2faEnabled?: boolean; // Not in docs, but state needed for UI.
  role?: 'user' | 'admin'; // Not in docs, but needed for UI routing.
  status?: 'active' | 'frozen'; // Not in docs, needed for admin UI.
  withdrawalStatus?: 'active' | 'paused'; // Not in docs, needed for admin UI.
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ twoFactorRequired: boolean, userId?: string } | void>;
  adminLogin: (email: string, pass: string) => Promise<void>;
  verifyTwoFactor: (userId: string, token: string) => Promise<void>;
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
  id: string;
  created_at: string;
  tx_type: 'deposit' | 'withdrawal' | 'commission' | 'bonus' | 'fee' | 'adjustment' | 'reversal';
  reference: string;
  amount: string; // Monetary values are strings from the backend
  status: 'completed' | 'pending' | 'failed';
  user?: { // For admin view
    name: string;
    email: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  username: string;
  level: number;
  joinDate: string;
  totalEarningsFrom: number;
  children: TeamMember[];
}


// --- KYC Types ---

export interface KycStatusResponse {
    status: 'unverified' | 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
}

// --- Admin Types ---

export interface AdminStats {
    totalUsers: number;
    totalUserReferralEarnings: number;
// Note: pendingWithdrawalsCount and protocolBalance are not in the docs but are used in the UI.
    pendingWithdrawalsCount: number;
    protocolBalance: number;
}

export interface KycRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    dateSubmitted: string;
    // These fields are from the old mock data, not the backend docs.
    // The backend only specifies document files. This may need reconciliation.
    address: string;
    city: string;
    postalCode: string;
    country: string;
    documentUrl: string; // The backend docs mention files, not a URL. This likely needs to be a link to view the file.
}

export interface WithdrawalRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: string; // Monetary values are strings
    date: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    // The following are part of the GET response, not the POST request.
    bank_name: string;
    account_number: string;
    account_name: string;
}
