import { createContext, useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { hashPassword } from '../lib/crypto';

export const AuthContext = createContext<{ logout: () => void }>({ logout: () => {} });

const HASH_KEY = 'mcc_password_hash';
const SESSION_KEY = 'mcc_session_active';

export default function PasswordGate({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const storedHash = localStorage.getItem(HASH_KEY);
    if (!storedHash) {
      setIsFirstTime(true);
    }
    const sessionActive = sessionStorage.getItem(SESSION_KEY);
    if (sessionActive === 'true' && storedHash) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const setupPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const hash = await hashPassword(password);
    localStorage.setItem(HASH_KEY, hash);
    sessionStorage.setItem(SESSION_KEY, 'true');
    setIsAuthenticated(true);
    setIsFirstTime(false);
    setPassword('');
    setConfirmPassword('');
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const hash = await hashPassword(password);
    const storedHash = localStorage.getItem(HASH_KEY);

    if (hash === storedHash) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsAuthenticated(true);
      setPassword('');
    } else {
      setError('Incorrect password.');
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setPassword('');
    setError('');
  };

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <AuthContext.Provider value={{ logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-lg p-8 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="text-sm font-semibold text-[#1a1a1a]">revise.right</div>
          <div className="text-[11px] text-[#6b7280]">Marketing Command Center</div>
        </div>

        {isFirstTime ? (
          <>
            <h2 className="text-[15px] font-semibold text-[#1a1a1a] text-center mb-6">
              Set a password
            </h2>
            <form onSubmit={setupPassword} className="space-y-4">
              <div>
                <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 outline-none"
                  placeholder="Enter a password"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 outline-none"
                  placeholder="Confirm your password"
                />
              </div>
              {error && <p className="text-[12px] text-red-500">{error}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-[#211d1d] hover:bg-[#352f2f] text-white rounded-lg text-[13px] font-medium transition-colors"
              >
                Set Password
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <Lock className="w-8 h-8 text-[#6b7280]" />
            </div>
            <h2 className="text-[15px] font-semibold text-[#1a1a1a] text-center mb-6">
              Enter password
            </h2>
            <form onSubmit={login} className="space-y-4">
              <div>
                <label className="text-[11px] text-[#6b7280] uppercase tracking-wider font-medium mb-1.5 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-[13px] text-[#1a1a1a] focus:border-[#211d1d] focus:ring-2 focus:ring-[#211d1d]/20 outline-none"
                  placeholder="Enter your password"
                />
              </div>
              {error && <p className="text-[12px] text-red-500">{error}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-[#211d1d] hover:bg-[#352f2f] text-white rounded-lg text-[13px] font-medium transition-colors"
              >
                Unlock
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
