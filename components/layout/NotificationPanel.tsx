'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load notifications targeting the user or general
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter((n: any) => !n.is_read).length)
        }
      } catch (err) {
        console.error('Error loading notifications:', err)
      }
    }

    loadNotifications()

    // Add click listener outside to close panel
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update local state first
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)

      // Sync with Supabase (mark all notifications read)
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }

  const markSingleAsRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
    } catch (err) {
      console.error('Error marking notification read:', err)
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 38,
          height: 38,
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative'
        }}
        aria-label="Notifications"
      >
        <Bell size={18} color="#64748B" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 14,
            height: 14,
            background: '#DC2626',
            borderRadius: '50%',
            border: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '8px',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '120%',
          right: 0,
          width: 320,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          zIndex: 999,
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #F1F5F9'
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16A34A',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markSingleAsRead(n.id)}
                  style={{
                    padding: 12,
                    borderBottom: '1px solid #F8FAFC',
                    cursor: n.is_read ? 'default' : 'pointer',
                    background: n.is_read ? '#FFFFFF' : '#F0FDF4',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <p style={{
                    fontSize: 13,
                    fontWeight: n.is_read ? 500 : 700,
                    color: '#0F172A',
                    margin: '0 0 4px 0'
                  }}>{n.title}</p>
                  <p style={{
                    fontSize: 11,
                    color: '#64748B',
                    margin: '0 0 6px 0',
                    lineHeight: 1.3
                  }}>{n.body}</p>
                  <span style={{ fontSize: 9, color: '#94A3B8' }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
