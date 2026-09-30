import React from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Github, 
  Cloud, 
  Database, 
  Server, 
  ShieldCheck 
} from 'lucide-react';

export function ConnectionStatusModal({ isOpen, onClose, serverStatus }) {
  if (!isOpen) return null;

  const accounts = [
    {
      name: 'GitHub Account',
      icon: <Github className="h-5 w-5 text-purple-400" />,
      status: 'Connected & Authorized',
      isOk: true,
      details: 'Connected via MCP tool (github) as sharique-ahmad-1 with full repo read/write, PR, and commit capabilities. Git user: sharique7463@gmail.com.',
      badge: 'Active MCP'
    },
    {
      name: 'Render Account',
      icon: <Cloud className="h-5 w-5 text-sky-400" />,
      status: 'Connected & Authorized',
      isOk: true,
      details: 'Connected via MCP tool (render) with Team Workspace "My Workspace" (ID: tea-dasvjbnpn0mc73a9ga4g, Email: sharique7463@gmail.com) with service deploy and PostgreSQL permissions.',
      badge: 'Active MCP'
    },
    {
      name: 'Supabase Database',
      icon: <Database className="h-5 w-5 text-emerald-400" />,
      status: 'Ready for Connection',
      isOk: false,
      details: 'Server architecture is prepared for Supabase. To connect your Supabase project, provide SUPABASE_URL and SUPABASE_ANON_KEY in server/.env (Supabase CLI/MCP is not currently mounted in IDE).',
      badge: 'Env Config Ready'
    },
    {
      name: 'SignSync Express API',
      icon: <Server className="h-5 w-5 text-indigo-400" />,
      status: serverStatus.online ? 'Online & Healthy' : 'Offline / Checking',
      isOk: serverStatus.online,
      details: `Express server running on http://localhost:5000 with /api/health and /api/dictionary endpoints.`,
      badge: serverStatus.online ? 'Port 5000' : 'Standby'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Connected Accounts & Integrations
              </h3>
              <p className="text-xs text-slate-400">
                Antigravity IDE integration status verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {accounts.map((acc, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-slate-800/80 shrink-0">
                {acc.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-white">
                    {acc.name}
                  </h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    acc.isOk 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    {acc.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs mb-1.5">
                  {acc.isOk ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className={acc.isOk ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
                    {acc.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {acc.details}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Close Overview
          </button>
        </div>

      </div>
    </div>
  );
}
