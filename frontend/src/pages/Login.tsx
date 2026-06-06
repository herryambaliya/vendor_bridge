import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { showToast } from '../components/ui/Toast';
import { Eye, EyeOff, Building2, Briefcase, Shield, ShoppingBag, User, Sparkles } from 'lucide-react';

interface LoginFormInputs {
  email: string;
  password_hash: string;
}

export const Login: React.FC = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormInputs>();
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [activeDemo, setActiveDemo] = React.useState<string | null>(null);

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const user = await login(data.email, data.password_hash);
      showToast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'vendor') {
        navigate('/my-rfqs');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || err?.message || 'Login failed');
    }
  };

  const handleDemoLogin = (email: string) => {
    setActiveDemo(email);
    setValue('email', email);
    
    // Map email to correct seeded password
    let password = 'Password@123';
    if (email.startsWith('admin')) password = 'Admin@123';
    else if (email.startsWith('officer')) password = 'Officer@123';
    else if (email.startsWith('manager')) password = 'Manager@123';
    else if (email.startsWith('vendor')) password = 'Vendor@123';
    
    setValue('password_hash', password);
    handleSubmit(onSubmit)();
  };

  const demoAccounts = [
    { email: 'officer@vb.com',    role: 'Procurement Officer', icon: <Briefcase className="h-4 w-4" />, accent: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.20)' },
    { email: 'vendor@furnico.com', role: 'Vendor Supplier',     icon: <ShoppingBag className="h-4 w-4" />, accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)' },
    { email: 'manager@vb.com',    role: 'Approving Manager',   icon: <Shield className="h-4 w-4" />, accent: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)' },
    { email: 'admin@vb.com',      role: 'System Admin',        icon: <User className="h-4 w-4" />, accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.20)' },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 35%, #fdf4ff 65%, #f0fdf4 100%)',
      }}
    >
      {/* Floating glass blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[100px] animate-pulse-slow"
          style={{ background: 'rgba(99,102,241,0.18)' }}
        />
        <div
          className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[120px] animate-pulse-slow"
          style={{ background: 'rgba(16,185,129,0.14)', animationDelay: '3s' }}
        />
        <div
          className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse-slow"
          style={{ background: 'rgba(245,158,11,0.10)', animationDelay: '6s' }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
        {/* Brand logo row */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              boxShadow: '0 8px 28px rgba(37,99,235,0.35)',
            }}
          >
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #2563eb, #4f46e5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              VendorBridge
            </h1>
            <div className="flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Procurement ERP</p>
            </div>
          </div>
        </div>

        {/* === GLASS CARD === */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 24px 64px rgba(100,116,139,0.14), 0 1px 0 rgba(255,255,255,1) inset',
          }}
        >
          {/* Top gradient stripe */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #2563eb, #6366f1, #8b5cf6, #ec4899)' }}
          />

          <div className="p-8">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(148,163,184,0.20)',
                    boxShadow: '0 4px 20px rgba(100,116,139,0.12)',
                  }}
                >
                  <User className="h-9 w-9 text-slate-300" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}
                >
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            <h2 className="text-center text-2xl font-bold text-slate-800 tracking-tight mb-1">
              Welcome Back
            </h2>
            <p className="text-center text-xs text-slate-500 mb-8">
              Sign in to your workspace ·{' '}
              <Link to="/signup" className="font-semibold transition-colors" style={{ color: '#2563eb' }}>
                Create account
              </Link>
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-xl text-rose-600 text-sm text-center font-medium"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Username / Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 rounded-xl text-slate-800 placeholder-slate-300 text-sm transition-all duration-200 focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    border: '1.5px solid rgba(148,163,184,0.25)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 2px 8px rgba(100,116,139,0.06)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(37,99,235,0.50)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10), 0 2px 8px rgba(100,116,139,0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(100,116,139,0.06)';
                  }}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && <p className="mt-1.5 text-xs text-rose-500">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password_hash"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-xl text-slate-800 placeholder-slate-300 text-sm transition-all duration-200 focus:outline-none pr-11"
                    style={{
                      background: 'rgba(255,255,255,0.65)',
                      border: '1.5px solid rgba(148,163,184,0.25)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(100,116,139,0.06)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(37,99,235,0.50)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10), 0 2px 8px rgba(100,116,139,0.06)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(100,116,139,0.06)';
                    }}
                    {...register('password_hash', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password_hash && (
                  <p className="mt-1.5 text-xs text-rose-500">{errors.password_hash.message}</p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 text-white font-bold rounded-xl transition-all duration-200 text-sm tracking-wide disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(37,99,235,0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(37,99,235,0.35)';
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-7 pt-6" style={{ borderTop: '1px solid rgba(148,163,184,0.15)' }}>
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Quick Demo Accounts
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoLogin(acc.email)}
                    className="flex items-center gap-2.5 p-3 rounded-2xl text-left transition-all duration-200"
                    style={{
                      background: activeDemo === acc.email ? acc.bg : 'rgba(255,255,255,0.55)',
                      border: `1px solid ${activeDemo === acc.email ? acc.border : 'rgba(148,163,184,0.20)'}`,
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(100,116,139,0.05)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = acc.bg;
                      (e.currentTarget as HTMLButtonElement).style.borderColor = acc.border;
                    }}
                    onMouseLeave={(e) => {
                      if (activeDemo !== acc.email) {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.55)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(148,163,184,0.20)';
                      }
                    }}
                  >
                    <div
                      className="p-1.5 rounded-xl shrink-0"
                      style={{ background: acc.bg, color: acc.accent }}
                    >
                      {acc.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">{acc.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          VendorBridge ERP v1.0 · Procurement Management Platform
        </p>
      </div>
    </div>
  );
};

export default Login;
