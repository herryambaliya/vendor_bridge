import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  BarChart3,
  Clock,
  LogOut,
  ShoppingBag,
  UserSquare2,
  Building2,
  Receipt,
  ChevronRight,
  Sparkles,
  FileCheck2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const normalizedRole = user.role === 'officer' ? 'procurement_officer' : user.role;

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    procurement_officer: 'Procurement Officer',
    manager: 'Approving Manager',
    vendor: 'Vendor Portal',
  };

  const roleGradients: Record<string, { from: string; to: string; glow: string }> = {
    admin:               { from: '#7c3aed', to: '#9333ea', glow: 'rgba(124,58,237,0.25)' },
    procurement_officer: { from: '#2563eb', to: '#4f46e5', glow: 'rgba(37,99,235,0.25)' },
    manager:             { from: '#059669', to: '#0d9488', glow: 'rgba(5,150,105,0.25)' },
    vendor:              { from: '#d97706', to: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
  };

  const roleIconColors: Record<string, string> = {
    admin: 'text-violet-500',
    procurement_officer: 'text-blue-500',
    manager: 'text-emerald-500',
    vendor: 'text-amber-500',
  };

  const getNavLinks = () => {
    const common = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, accent: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    ];

    if (normalizedRole === 'admin') {
      return [
        ...common,
        { to: '/vendors',       label: 'Vendor Registry', icon: Building2,    accent: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
        { to: '/reports',       label: 'Reports',         icon: BarChart3,    accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        { to: '/activity-logs', label: 'Activity Logs',   icon: Clock,        accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
      ];
    }

    if (normalizedRole === 'procurement_officer') {
      return [
        ...common,
        { to: '/vendors',         label: 'Vendors',         icon: Building2,    accent: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
        { to: '/rfqs',            label: "RFQ's",           icon: FileText,     accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
        { to: '/quotations',      label: 'Quotations',      icon: FileCheck2,   accent: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
        { to: '/approvals',       label: 'Approvals',       icon: CheckSquare,  accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBag,  accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
        { to: '/invoices',        label: 'Invoices',        icon: Receipt,      accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        { to: '/reports',         label: 'Reports',         icon: BarChart3,    accent: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
        { to: '/activity-logs',   label: 'Activity Logs',   icon: Clock,        accent: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
      ];
    }

    if (normalizedRole === 'manager') {
      return [
        ...common,
        { to: '/approvals',       label: 'Approvals',       icon: CheckSquare,  accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingBag,  accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)' },
        { to: '/invoices',        label: 'Invoices',        icon: Receipt,      accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        { to: '/reports',         label: 'Reports',         icon: BarChart3,    accent: '#14b8a6', bg: 'rgba(20,184,166,0.08)' },
        { to: '/activity-logs',   label: 'Activity Logs',   icon: Clock,        accent: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
      ];
    }

    if (normalizedRole === 'vendor') {
      return [
        ...common,
        { to: '/my-rfqs',    label: 'Assigned RFQs', icon: FileText,   accent: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
        { to: '/quotations', label: 'Quotations',    icon: FileCheck2, accent: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
      ];
    }

    return common;
  };

  const navLinks = getNavLinks();
  const rg = roleGradients[normalizedRole] || roleGradients.procurement_officer;

  return (
    <aside
      className="no-print shrink-0 relative overflow-hidden flex flex-col"
      style={{
        width: '260px',
        minHeight: '100vh',
        background: 'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(248,250,255,0.88) 50%, rgba(241,245,255,0.90) 100%)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        borderRight: '1px solid rgba(148,163,184,0.18)',
        boxShadow: '4px 0 32px rgba(100,116,139,0.08), 1px 0 0 rgba(255,255,255,0.8) inset',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      {/* Liquid blob backgrounds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: rg.glow }}
        />
        <div
          className="absolute bottom-16 -right-16 w-56 h-56 rounded-full blur-3xl animate-pulse-slow"
          style={{ background: 'rgba(99,102,241,0.12)', animationDelay: '3s' }}
        />
        <div
          className="absolute top-1/2 -left-8 w-40 h-40 rounded-full blur-2xl animate-pulse-slow"
          style={{ background: 'rgba(6,182,212,0.08)', animationDelay: '6s' }}
        />
      </div>

      {/* === BRAND HEADER === */}
      <div
        className="relative px-5 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(148,163,184,0.14)' }}
      >
        <div className="flex items-center gap-3">
          {/* Logo pill */}
          <div
            className="h-11 w-11 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-lg shrink-0 relative"
            style={{
              background: `linear-gradient(135deg, ${rg.from} 0%, ${rg.to} 100%)`,
              boxShadow: `0 4px 16px ${rg.glow}`,
            }}
          >
            <span className="tracking-tight">VB</span>
            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse shadow-sm" />
          </div>

          <div>
            <h1
              className="text-sm font-extrabold tracking-tight"
              style={{
                background: `linear-gradient(90deg, ${rg.from}, ${rg.to})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              VendorBridge
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="h-2.5 w-2.5 text-amber-400" />
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Procurement ERP</p>
            </div>
          </div>
        </div>
      </div>

      {/* === NAVIGATION === */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400/80 px-3 mb-3">
          Navigation
        </p>

        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onMouseEnter={() => setHovered(link.to)}
              onMouseLeave={() => setHovered(null)}
              className="block"
            >
              {({ isActive }) => (
                <div
                  className="relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 overflow-hidden"
                  style={{
                    color: isActive ? link.accent : '#475569',
                    background: isActive
                      ? link.bg
                      : hovered === link.to
                      ? 'rgba(148,163,184,0.08)'
                      : 'transparent',
                    border: isActive
                      ? `1px solid ${link.accent}22`
                      : '1px solid transparent',
                    transform: hovered === link.to && !isActive ? 'translateX(2px)' : 'none',
                  }}
                >
                  {/* Active left bar */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                      style={{ background: link.accent }}
                    />
                  )}

                  {/* Icon box */}
                  <div
                    className="relative shrink-0 h-7 w-7 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      background: isActive ? `${link.accent}18` : 'rgba(148,163,184,0.10)',
                      boxShadow: isActive ? `0 2px 8px ${link.accent}20` : 'none',
                    }}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: isActive ? link.accent : '#64748b' }}
                    />
                  </div>

                  <span className="flex-1 truncate">{link.label}</span>

                  {isActive && (
                    <ChevronRight
                      className="h-3 w-3 shrink-0 opacity-50"
                      style={{ color: link.accent }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* === USER PROFILE + LOGOUT === */}
      <div
        className="relative shrink-0 p-4 space-y-2.5"
        style={{ borderTop: '1px solid rgba(148,163,184,0.14)' }}
      >
        {/* User card — frosted */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(148,163,184,0.18)',
            boxShadow: '0 2px 12px rgba(100,116,139,0.07)',
          }}
        >
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${rg.from}, ${rg.to})`,
              boxShadow: `0 2px 8px ${rg.glow}`,
            }}
          >
            <UserSquare2 className="h-4 w-4 text-white" />
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
            <p className="text-[9px] text-slate-500 font-semibold truncate">{roleLabels[user.role]}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group"
          style={{
            color: '#94a3b8',
            background: 'transparent',
            border: '1px solid rgba(148,163,184,0.15)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(244,63,94,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(244,63,94,0.20)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(148,163,184,0.15)';
          }}
        >
          <LogOut className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform duration-200" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
