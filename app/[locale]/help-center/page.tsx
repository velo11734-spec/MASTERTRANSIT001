'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, BookOpen, CreditCard, RefreshCw, FileText,
  Building2, Shield, AlertTriangle, HelpCircle, Headphones,
  Clock, ChevronRight, X, ThumbsUp, ThumbsDown, ArrowLeft,
  Bus, Users, Smartphone,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ─── Icon map for categories (by slug) ────────────────────────────────────────
const ICON_MAP: Record<string, any> = {
  accounts:  Users,
  booking:   BookOpen,
  payments:  CreditCard,
  trips:     Bus,
  companies: Building2,
  safety:    Shield,
  technical: Smartphone,
  partners:  FileText,
  drivers:   Headphones,
  default:   HelpCircle,
};

const COLOR_MAP: Record<string, { color: string; bg: string }> = {
  accounts:  { color: '#2563EB', bg: '#EFF6FF' },
  booking:   { color: '#7C3AED', bg: '#F5F3FF' },
  payments:  { color: '#16A34A', bg: '#F0FDF4' },
  trips:     { color: '#EA580C', bg: '#FFF7ED' },
  companies: { color: '#0891B2', bg: '#ECFEFF' },
  safety:    { color: '#DC2626', bg: '#FEF2F2' },
  technical: { color: '#D97706', bg: '#FFFBEB' },
  partners:  { color: '#7C3AED', bg: '#F5F3FF' },
  drivers:   { color: '#064E3B', bg: '#ECFDF5' },
  default:   { color: '#475569', bg: '#F8FAFC' },
};

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sort_order: number;
  article_count?: number;
}

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category_id: string;
  is_published: boolean;
  views: number;
  helpful_yes: number;
  helpful_no: number;
  tags: string[];
  created_at: string;
}

export default function HelpCenterPage() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [helpfulVoted, setHelpfulVoted] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: cats } = await supabase
        .from('help_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      // Fetch published articles
      const { data: arts } = await supabase
        .from('help_articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');

      // Count articles per category
      const catsWithCount = (cats || []).map(cat => ({
        ...cat,
        article_count: (arts || []).filter(a => a.category_id === cat.id).length,
      }));

      setCategories(catsWithCount);
      setArticles(arts || []);
      setFilteredArticles(arts || []);
    } catch (err) {
      console.error('Error fetching help center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = articles;
    if (activeCategory) {
      result = result.filter(a => a.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.excerpt || '').toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    setFilteredArticles(result);
  }, [search, activeCategory, articles]);

  const openArticle = async (article: HelpArticle) => {
    setSelectedArticle(article);
    setHelpfulVoted(null);
    // Increment view count
    await supabase.from('help_articles').update({ views: (article.views || 0) + 1 }).eq('id', article.id);
  };

  const handleHelpful = async (vote: 'yes' | 'no') => {
    if (!selectedArticle || helpfulVoted) return;
    setHelpfulVoted(vote);
    const update = vote === 'yes'
      ? { helpful_yes: (selectedArticle.helpful_yes || 0) + 1 }
      : { helpful_no: (selectedArticle.helpful_no || 0) + 1 };
    await supabase.from('help_articles').update(update).eq('id', selectedArticle.id);
  };

  const activeCategoryName = categories.find(c => c.id === activeCategory)?.name;

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .cat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .art-row:hover { background: #F0FDF4 !important; }
        .cat-filter:hover { background: #E2E8F0 !important; }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #064E3B 100%)', padding: '64px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', color: '#4ADE80', borderRadius: 999, padding: '5px 18px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          Help Centre
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 800, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.2 }}>
          How can we help you?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 16, marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
          Search our knowledge base or browse by topic to find the answers you need.
        </p>
        {/* Search */}
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search articles... e.g. 'how to cancel', 'refund', 'ticket'"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 48px',
              borderRadius: 12, border: 'none', fontSize: 15,
              background: '#FFFFFF', boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
              <X size={16} />
            </button>
          )}
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* ── CATEGORY GRID ── */}
        {!search && !activeCategory && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 24 }}>Browse by Topic</h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Loading categories...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {categories.map(cat => {
                  const IconComp = ICON_MAP[cat.slug] || ICON_MAP.default;
                  const palette = COLOR_MAP[cat.slug] || COLOR_MAP.default;
                  return (
                    <div
                      key={cat.id}
                      className="cat-card"
                      onClick={() => setActiveCategory(cat.id)}
                      style={{
                        background: '#FFFFFF', borderRadius: 14, padding: '24px 20px',
                        border: '1px solid #E2E8F0', cursor: 'pointer',
                        transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <IconComp size={22} style={{ color: palette.color }} />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{cat.name}</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>{cat.article_count || 0} articles</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── CATEGORY FILTERS (when browsing) ── */}
        {(search || activeCategory) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
            <button
              onClick={() => { setActiveCategory(null); setSearch(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
            >
              <ArrowLeft size={14} /> All Topics
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className="cat-filter"
                onClick={() => setActiveCategory(cat.id === activeCategory ? null : cat.id)}
                style={{
                  background: cat.id === activeCategory ? '#0F172A' : '#F1F5F9',
                  color: cat.id === activeCategory ? '#FFFFFF' : '#475569',
                  border: 'none', borderRadius: 8, padding: '7px 14px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── ARTICLE LIST ── */}
        {(search || activeCategory) && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                {activeCategoryName ? activeCategoryName : `Search results for "${search}"`}
                <span style={{ fontSize: 14, fontWeight: 400, color: '#64748B', marginLeft: 8 }}>({filteredArticles.length} articles)</span>
              </h2>
            </div>
            {filteredArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
                <HelpCircle size={40} style={{ color: '#CBD5E1', margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>No articles found</p>
                <p style={{ fontSize: 14, color: '#64748B' }}>Try a different search term or browse another category.</p>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                {filteredArticles.map((article, i) => (
                  <div
                    key={article.id}
                    className="art-row"
                    onClick={() => openArticle(article)}
                    style={{
                      padding: '18px 24px', cursor: 'pointer', transition: 'background 0.15s',
                      borderBottom: i < filteredArticles.length - 1 ? '1px solid #F1F5F9' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{article.title}</p>
                      {article.excerpt && <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{article.excerpt}</p>}
                      <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        {(article.tags || []).slice(0, 3).map(tag => (
                          <span key={tag} style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 999, fontWeight: 500 }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight size={18} style={{ color: '#CBD5E1', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── POPULAR ARTICLES (when no filter) ── */}
        {!search && !activeCategory && !loading && articles.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Popular Articles</h2>
            <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {articles.slice(0, 8).map((article, i) => {
                const cat = categories.find(c => c.id === article.category_id);
                const palette = cat ? (COLOR_MAP[cat.slug] || COLOR_MAP.default) : COLOR_MAP.default;
                return (
                  <div
                    key={article.id}
                    className="art-row"
                    onClick={() => openArticle(article)}
                    style={{
                      padding: '16px 24px', cursor: 'pointer', transition: 'background 0.15s',
                      borderBottom: i < Math.min(articles.length, 8) - 1 ? '1px solid #F1F5F9' : 'none',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={15} style={{ color: palette.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{article.title}</p>
                      {cat && <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{cat.name}</p>}
                    </div>
                    <ChevronRight size={16} style={{ color: '#CBD5E1' }} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CONTACT SUPPORT ── */}
        {!search && !activeCategory && (
          <section style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 20, padding: '40px 32px', textAlign: 'center' }}>
            <Headphones size={36} style={{ color: '#4ADE80', margin: '0 auto 16px', display: 'block' }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Still need help?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Our support team is ready to assist you 24/7.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="mailto:support@routepro.ng" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#16A34A', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
                Email Support
              </a>
              <a href="tel:+2348001234567" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.2)' }}>
                Call Support
              </a>
            </div>
          </section>
        )}
      </div>

      {/* ── ARTICLE DETAIL MODAL ── */}
      {selectedArticle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, width: '100%', maxWidth: 720, padding: '36px', position: 'relative', marginTop: 20 }}>
            {/* Close */}
            <button onClick={() => setSelectedArticle(null)} style={{ position: 'absolute', top: 20, right: 20, background: '#F1F5F9', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#64748B' }}>
              <X size={18} />
            </button>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: '#94A3B8' }}>
              <button onClick={() => setSelectedArticle(null)} style={{ background: 'none', border: 'none', color: '#16A34A', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Help Centre</button>
              <ChevronRight size={12} />
              <span style={{ color: '#64748B' }}>{categories.find(c => c.id === selectedArticle.category_id)?.name}</span>
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 20, lineHeight: 1.3, fontFamily: "'Outfit', sans-serif" }}>
              {selectedArticle.title}
            </h1>

            {/* Article content */}
            <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', borderTop: '1px solid #F1F5F9', paddingTop: 20 }}>
              {selectedArticle.content}
            </div>

            {/* Tags */}
            {(selectedArticle.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 24, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
                {selectedArticle.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 12, background: '#F1F5F9', color: '#475569', padding: '3px 10px', borderRadius: 999 }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Helpful vote */}
            <div style={{ marginTop: 28, padding: '20px', background: '#F8FAFC', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Was this article helpful?</p>
              {helpfulVoted ? (
                <p style={{ fontSize: 14, color: '#16A34A', fontWeight: 600 }}>
                  ✅ Thanks for your feedback!
                </p>
              ) : (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={() => handleHelpful('yes')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DCFCE7', color: '#15803D', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    <ThumbsUp size={15} /> Yes, helpful
                  </button>
                  <button onClick={() => handleHelpful('no')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    <ThumbsDown size={15} /> Not helpful
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
