'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Settings, Save, RefreshCw, Edit2, X, Check,
  DollarSign, Clock, Ticket, Globe, Phone, Mail,
  Zap, Tag,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlatformSetting {
  id: string;
  key: string;
  value: string | null;
  label: string | null;
  description: string | null;
  category: string | null;
  updated_at: string | null;
}

type Toast = { msg: string; ok: boolean };

const CATEGORY_ICON: Record<string, React.ElementType> = {
  finance:   DollarSign,
  booking:   Ticket,
  branding:  Globe,
  contact:   Mail,
  system:    Settings,
  emergency: Zap,
};

const CATEGORY_COLOR: Record<string, string> = {
  finance:   '#16A34A',
  booking:   '#2563EB',
  branding:  '#8B5CF6',
  contact:   '#EC4899',
  system:    '#64748B',
  emergency: '#DC2626',
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

async function logAudit(key: string, oldVal: string | null, newVal: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      actor_id: user.id, actor_email: user.email,
      action: 'PLATFORM_SETTING_UPDATED',
      entity_type: 'platform_setting', entity_id: key,
      old_value: { value: oldVal }, new_value: { value: newVal },
    });
  } catch (_) {}
}

const s: Record<string, React.CSSProperties> = {
  page:    { background: '#0F172A', minHeight: '100vh', fontFamily: "'Outfit', sans-serif", color: '#F8FAFC', padding: '32px' },
  header:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' },
  title:   { fontSize: '26px', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  card:    { background: '#1E293B', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', marginBottom: '20px' },
  sectionTitle: { fontSize: '14px', fontWeight: 700, color: '#94A3B8', marginBottom: '14px', textTransform: 'uppercase' as const, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '7px' },
  actionBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', color: '#94A3B8', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  row:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  input:   { background: '#0F172A', border: '1px solid #334155', borderRadius: '8px', padding: '7px 12px', color: '#F8FAFC', fontSize: '13px', outline: 'none', minWidth: '180px' },
  saveBtn: { background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' },
  empty:   { textAlign: 'center' as const, padding: '60px 20px', color: '#475569' },
};

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState<Record<string, boolean>>({});
  const [toast, setToast]       = useState<Toast | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('platform_settings')
        .select('*')
        .order('category')
        .order('label');
      setSettings(data ?? []);
    } catch (_) {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startEdit = (s: PlatformSetting) => {
    setEditing(prev => ({ ...prev, [s.key]: s.value ?? '' }));
  };

  const cancelEdit = (key: string) => {
    setEditing(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
  };

  const saveSetting = async (setting: PlatformSetting) => {
    const newVal = editing[setting.key] ?? '';
    setSaving(prev => ({ ...prev, [setting.key]: true }));
    try {
      await supabase.from('platform_settings').update({
        value: newVal,
        updated_at: new Date().toISOString(),
      }).eq('key', setting.key);
      await logAudit(setting.key, setting.value, newVal);
      cancelEdit(setting.key);
      showToast(`"${setting.label ?? setting.key}" updated`);
      load();
    } catch (_) {
      showToast('Failed to save setting', false);
    } finally {
      setSaving(prev => ({ ...prev, [setting.key]: false }));
    }
  };

  // Group by category
  const grouped = settings.reduce<Record<string, PlatformSetting[]>>((acc, s) => {
    const cat = s.category ?? 'other';
    acc[cat] = acc[cat] ?? [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div style={s.page}>
      {toast && (
        <div style={{ position: 'fixed', bottom: '28px', right: '28px', background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}><Settings size={24} color="#16A34A" /> Platform Settings</h1>
        <button id="refresh-settings-btn" onClick={load} style={{ ...s.actionBtn, padding: '10px 14px' }}><RefreshCw size={16} /></button>
      </div>

      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
        All settings are stored in the database and take effect immediately. Every change is audit-logged.
      </p>

      {loading ? (
        <div style={s.empty}><RefreshCw size={32} color="#334155" style={{ animation: 'spin 1s linear infinite' }} /><p style={{ marginTop: '12px' }}>Loading settings…</p></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={s.empty}>
          <Settings size={40} color="#334155" />
          <p style={{ marginTop: '12px' }}>No settings configured yet.</p>
          <p style={{ fontSize: '13px' }}>Run the migration to populate default settings.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => {
          const Icon = CATEGORY_ICON[cat] ?? Tag;
          const color = CATEGORY_COLOR[cat] ?? '#94A3B8';
          return (
            <div key={cat} style={s.card}>
              <p style={{ ...s.sectionTitle, color }}>
                <Icon size={16} />
                {cat.charAt(0).toUpperCase() + cat.slice(1)} Settings
              </p>

              {items.map((setting, idx) => {
                const isEditing = setting.key in editing;
                const isSaving  = saving[setting.key] === true;
                const isBoolean = setting.value === 'true' || setting.value === 'false';
                return (
                  <div key={setting.key} style={{ ...s.row, borderBottom: idx === items.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#E2E8F0' }}>{setting.label ?? setting.key}</p>
                      {setting.description && <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748B' }}>{setting.description}</p>}
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#334155' }}>Last updated: {fmtDate(setting.updated_at)}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '20px' }}>
                      {isEditing ? (
                        <>
                          {isBoolean ? (
                            <select
                              id={`setting-select-${setting.key}`}
                              value={editing[setting.key]}
                              onChange={e => setEditing(prev => ({ ...prev, [setting.key]: e.target.value }))}
                              style={{ ...s.input, cursor: 'pointer' }}
                            >
                              <option value="true">Enabled</option>
                              <option value="false">Disabled</option>
                            </select>
                          ) : (
                            <input
                              id={`setting-input-${setting.key}`}
                              type={setting.key.includes('rate') || setting.key.includes('fee') || setting.key.includes('hours') || setting.key.includes('days') || setting.key.includes('seats') ? 'number' : 'text'}
                              value={editing[setting.key]}
                              onChange={e => setEditing(prev => ({ ...prev, [setting.key]: e.target.value }))}
                              style={s.input}
                            />
                          )}
                          <button id={`setting-save-${setting.key}`} onClick={() => saveSetting(setting)} disabled={isSaving} style={{ ...s.saveBtn, opacity: isSaving ? 0.7 : 1 }}>
                            {isSaving ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                            {isSaving ? 'Saving' : 'Save'}
                          </button>
                          <button id={`setting-cancel-${setting.key}`} onClick={() => cancelEdit(setting.key)} style={{ ...s.actionBtn }}>
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{
                            background: isBoolean
                              ? (setting.value === 'true' ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.12)')
                              : 'rgba(255,255,255,0.06)',
                            color: isBoolean
                              ? (setting.value === 'true' ? '#EF4444' : '#22C55E')
                              : '#F1F5F9',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 700,
                            minWidth: '80px',
                            textAlign: 'center' as const,
                          }}>
                            {isBoolean ? (setting.value === 'true' ? 'Enabled' : 'Disabled') : (setting.value ?? '—')}
                          </span>
                          <button id={`setting-edit-${setting.key}`} onClick={() => startEdit(setting)} style={s.actionBtn}>
                            <Edit2 size={13} /> Edit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
