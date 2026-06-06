import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { showToast } from '../components/ui/Toast';
import { Building2, User, Upload, Globe, Phone, Mail, Briefcase, FileText, ChevronDown, Sparkles } from 'lucide-react';

interface SignupFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'procurement_officer' | 'manager' | 'vendor' | 'admin';
  country: string;
  additionalInfo: string;
}

export const Signup: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormInputs>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onSubmit = async (data: SignupFormInputs) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullName = `${data.firstName} ${data.lastName}`.trim();
      await api.auth.signup(fullName, data.email, data.role);
      showToast.success('Account registered successfully! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Registration failed';
      setError(errMsg);
      showToast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Shared glass input style
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.65)',
    border: '1.5px solid rgba(148,163,184,0.25)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(100,116,139,0.06)',
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(37,99,235,0.50)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.10), 0 2px 8px rgba(100,116,139,0.06)';
    e.currentTarget.style.outline = 'none';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
    e.currentTarget.style.boxShadow = '0 2px 8px rgba(100,116,139,0.06)';
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-slate-800 placeholder-slate-300 text-sm transition-all duration-200 focus:outline-none";

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-10"
      style={{
        background: 'linear-gradient(135deg, #fdf4ff 0%, #f0f9ff 30%, #e0e7ff 65%, #f0fdf4 100%)',
      }}
    >
      {/* Floating glass blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[110px] animate-pulse-slow"
          style={{ background: 'rgba(139,92,246,0.16)' }}
        />
        <div
          className="absolute bottom-[-5%] left-[-5%] w-[450px] h-[450px] rounded-full blur-[120px] animate-pulse-slow"
          style={{ background: 'rgba(16,185,129,0.13)', animationDelay: '3s' }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse-slow"
          style={{ background: 'rgba(37,99,235,0.10)', animationDelay: '5s' }}
        />
      </div>

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#8b5cf6 1px, transparent 1px), linear-gradient(90deg, #8b5cf6 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-xl mx-4 animate-fade-in-up">
        {/* Brand row */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              boxShadow: '0 8px 28px rgba(124,58,237,0.35)',
            }}
          >
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1
              className="text-xl font-extrabold tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
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
          {/* Top stripe */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4, #10b981)' }}
          />

          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1 text-center">
              Create Account
            </h2>
            <p className="text-center text-xs text-slate-500 mb-7">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold transition-colors" style={{ color: '#2563eb' }}>
                Sign in here
              </Link>
            </p>

            {/* Photo Upload */}
            <div className="flex justify-center mb-7">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.80)',
                    backdropFilter: 'blur(10px)',
                    border: '2.5px dashed rgba(148,163,184,0.30)',
                    boxShadow: '0 4px 20px rgba(100,116,139,0.10)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.55)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148,163,184,0.30)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(100,116,139,0.10)';
                  }}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-slate-300 mx-auto mb-1 group-hover:text-indigo-500 transition-colors duration-200" />
                      <span className="text-[10px] font-bold text-slate-300 group-hover:text-indigo-500 transition-colors duration-200">Photo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl text-rose-600 text-sm text-center font-medium"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Form panel — nested glass */}
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: 'rgba(248,250,252,0.55)',
                  border: '1px solid rgba(148,163,184,0.15)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {/* Row 1: Names */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-300 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="First Name"
                        className={`${inputClass} pl-10`}
                        style={inputStyle}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        {...register('firstName', { required: 'First name required' })}
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-xs text-rose-500">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Last Name"
                      className={inputClass}
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      {...register('lastName', { required: 'Last name required' })}
                    />
                    {errors.lastName && <p className="mt-1 text-xs text-rose-500">{errors.lastName.message}</p>}
                  </div>
                </div>

                {/* Row 2: Email + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-300 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className={`${inputClass} pl-10`}
                        style={inputStyle}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        {...register('email', {
                          required: 'Email required',
                          pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
                        })}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-300 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        className={`${inputClass} pl-10`}
                        style={inputStyle}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        {...register('phone')}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Role + Country */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-slate-300 pointer-events-none z-10" />
                    <select
                      className={`${inputClass} pl-10 appearance-none cursor-pointer`}
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      {...register('role', { required: 'Role required' })}
                    >
                      <option value="" disabled>Select Role</option>
                      <option value="procurement_officer">Procurement Officer</option>
                      <option value="vendor">Vendor Supplier</option>
                      <option value="manager">Approving Manager</option>
                      <option value="admin">System Admin</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-300 pointer-events-none" />
                    {errors.role && <p className="mt-1 text-xs text-rose-500">{errors.role.message}</p>}
                  </div>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3.5 h-4 w-4 text-slate-300 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Country"
                      className={`${inputClass} pl-10`}
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      {...register('country')}
                    />
                  </div>
                </div>

                {/* Row 4: Additional Info */}
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-300 pointer-events-none" />
                  <textarea
                    rows={3}
                    placeholder="Additional Information..."
                    className={`${inputClass} pl-10 resize-none`}
                    style={inputStyle}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    {...register('additionalInfo')}
                  />
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-3 text-white font-bold rounded-xl transition-all duration-200 text-sm tracking-wide disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                  boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 28px rgba(124,58,237,0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(124,58,237,0.35)';
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Registering...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          VendorBridge ERP v1.0 · Procurement Management Platform
        </p>
      </div>
    </div>
  );
};

export default Signup;
