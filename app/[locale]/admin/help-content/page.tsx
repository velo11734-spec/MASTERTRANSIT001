'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  RefreshCw, Plus, Edit2, Trash2, X, Search, BookOpen,
  FolderOpen, Eye, EyeOff, ToggleLeft, ToggleRight, Tag,
  AlertTriangle, CheckCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HelpCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  article_count?: number;
}

interface HelpArticle {
  id: string;
  title: string;
  category_id?: string;
  excerpt?: string;
  content?: string;
  tags?: string;
  is_published?: boolean;
  views?: number;
  created_at?: string;
  category_name?: string;
}

type Section = 'categories' | 'articles';

const EMPTY_CAT: Omit<HelpCategory, 'id' | 'created_at' | 'article_count'> = {
  name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true,
};
const EMPTY_ART: Omit<HelpArticle, 'id' | 'created_at' | 'category_name' | 'views'> = {
  title: '', category_id: '', excerpt: '', content: '', tags: '', is_published: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function logAudit(action: string, targetId: string, meta?: object) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      action, target_type: 'help_content', target_id: targetId,
      performed_by: user?.id ?? null, metadata: meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HelpContentPage() {
  const [section, setSection]         = useState<Section>('categories');
  const [categories, setCategories]   = useState<HelpCategory[]>([]);
  const [articles, setArticles]       = useState<HelpArticle[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [pubFilter, setPubFilter]     = useState('All');
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  // Category modal
  const [catModal, setCatModal]       = useState<'add' | 'edit' | null>(null);
  const [catForm, setCatForm]         = useState<typeof EMPTY_CAT>({ ...EMPTY_CAT });
  const [editCatId, setEditCatId]     = useState<string | null>(null);
  const [deleteCat, setDeleteCat]     = useState<HelpCategory | null>(null);

  // Article modal
  const [artModal, setArtModal]       = useState<'add' | 'edit' | null>(null);
  const [artForm, setArtForm]         = useState<typeof EMPTY_ART>({ ...EMPTY_ART });
  const [editArtId, setEditArtId]     = useState<string | null>(null);
  const [deleteArt, setDeleteArt]     = useState<HelpArticle | null>(null);

  const [saving, setSaving]           = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: cats }, { data: arts }] = await Promise.all([
        supabase.from('help_categories').select('*').order('sort_order'),
        supabase.from('help_articles').select('*').order('created_at', { ascending: false }),
      ]);

      const catList: HelpCategory[] = cats ?? [];
      const artList: HelpArticle[]  = arts ?? [];

      // Attach article counts to categories
      const countMap: Record<string, number> = {};
      artList.forEach((a) => {
        if (a.category_id) countMap[a.category_id] = (countMap[a.category_id] ?? 0) + 1;
      });
      setCategories(catList.map((c) => ({ ...c, article_count: countMap[c.id] ?? 0 })));

      // Attach category names to articles
      const catMap: Record<string, string> = {};
      catList.forEach((c) => { catMap[c.id] = c.name; });
      setArticles(artList.map((a) => ({ ...a, category_name: catMap[a.category_id ?? ''] ?? '—' })));
    } catch (err: any) {
      showToast(err.message ?? 'Failed to load help content', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Category CRUD ──────────────────────────────────────────────────────────

  const openAddCat = () => { setCatForm({ ...EMPTY_CAT }); setEditCatId(null); setCatModal('add'); };
  const openEditCat = (c: HelpCategory) => {
    setCatForm({ name: c.name, slug: c.slug ?? '', description: c.description ?? '', icon: c.icon ?? '', sort_order: c.sort_order ?? 0, is_active: c.is_active ?? true });
    setEditCatId(c.id);
    setCatModal('edit');
  };

  const saveCat = async () => {
    if (!catForm.name.trim()) { showToast('Category name is required', false); return; }
    setSaving(true);
    try {
      const payload = { ...catForm, slug: catForm.slug || toSlug(catForm.name) };
      if (catModal === 'add') {
        const { data, error } = await supabase.from('help_categories').insert(payload).select().single();
        if (error) throw error;
        await logAudit('create_help_category', data.id, { name: catForm.name });
      } else if (editCatId) {
        const { error } = await supabase.from('help_categories').update(payload).eq('id', editCatId);
        if (error) throw error;
        await logAudit('update_help_category', editCatId, { name: catForm.name });
      }
      showToast(`Category ${catModal === 'add' ? 'created' : 'updated'}`, true);
      setCatModal(null);
      fetchData();
    } catch (err: any) { showToast(err.message ?? 'Save failed', false); }
    finally { setSaving(false); }
  };

  const confirmDeleteCat = async () => {
    if (!deleteCat) return;
    setSaving(true);
    try {
      await supabase.from('help_categories').delete().eq('id', deleteCat.id);
      await logAudit('delete_help_category', deleteCat.id, { name: deleteCat.name });
      showToast('Category deleted', true);
      setDeleteCat(null);
      fetchData();
    } catch (err: any) { showToast(err.message ?? 'Delete failed', false); }
    finally { setSaving(false); }
  };

  // ── Article CRUD ────────────────────────────────────────────────────────────

  const openAddArt = () => { setArtForm({ ...EMPTY_ART }); setEditArtId(null); setArtModal('add'); };
  const openEditArt = (a: HelpArticle) => {
    setArtForm({ title: a.title, category_id: a.category_id ?? '', excerpt: a.excerpt ?? '', content: a.content ?? '', tags: a.tags ?? '', is_published: a.is_published ?? false });
    setEditArtId(a.id);
    setArtModal('edit');
  };

  const saveArt = async () => {
    if (!artForm.title.trim()) { showToast('Article title is required', false); return; }
    setSaving(true);
    try {
      if (artModal === 'add') {
        const { data, error } = await supabase.from('help_articles').insert(artForm).select().single();
        if (error) throw error;
        await logAudit('create_help_article', data.id, { title: artForm.title });
      } else if (editArtId) {
        const { error } = await supabase.from('help_articles').update(artForm).eq('id', editArtId);
        if (error) throw error;
        await logAudit('update_help_article', editArtId, { title: artForm.title });
      }
      showToast(`Article ${artModal === 'add' ? 'created' : 'updated'}`, true);
      setArtModal(null);
      fetchData();
    } catch (err: any) { showToast(err.message ?? 'Save failed', false); }
    finally { setSaving(false); }
  };

  const confirmDeleteArt = async () => {
    if (!deleteArt) return;
    setSaving(true);
    try {
      await supabase.from('help_articles').delete().eq('id', deleteArt.id);
      await logAudit('delete_help_article', deleteArt.id, { title: deleteArt.title });
      showToast('Article deleted', true);
      setDeleteArt(null);
      fetchData();
    } catch (err: any) { showToast(err.message ?? 'Delete failed', false); }
    finally { setSaving(false); }
  };

  // ── Filtered lists ──────────────────────────────────────────────────────────

  const filteredCats = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredArts = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchCat    = !catFilter || a.category_id === catFilter;
    const matchPub    = pubFilter === 'All' || (pubFilter === 'Published' ? a.is_published : !a.is_published);
    return matchSearch && matchCat && matchPub;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px', fontFamily: 'Inter, sans-serif' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.ok ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontSize: 14, fontWeight: 500 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0F172A', margin: 0 }}>Help Center Management</h1>
          <p style={{ color: '#64748B', marginTop: 4, fontSize: 14 }}>Manage help categories and articles</p>
        </div>
        <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
          <RefreshCw size={15}/> Refresh
        </button>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['categories', 'articles'] as Section[]).map((s) => (
          <button key={s} onClick={() => setSection(s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: section === s ? '#0F172A' : '#fff', color: section === s ? '#fff' : '#64748B', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}>
            {s === 'categories' ? <FolderOpen size={16}/> : <BookOpen size={16}/>}
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span style={{ background: section === s ? 'rgba(255,255,255,0.2)' : '#F1F5F9', color: section === s ? '#fff' : '#64748B', borderRadius: 20, padding: '2px 8px', fontSize: 12 }}>
              {s === 'categories' ? categories.length : articles.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── CATEGORIES SECTION ── */}
      {section === 'categories' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}/>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…"
                style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}/>
            </div>
            <button onClick={openAddCat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              <Plus size={15}/> Add Category
            </button>
          </div>

          {loading ? <LoadingState/> : filteredCats.length === 0 ? (
            <EmptyState icon={<FolderOpen size={36}/>} label="No categories yet" action={<button onClick={openAddCat} style={{ marginTop: 12, padding: '8px 20px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Add First Category</button>}/>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Name', 'Slug', 'Articles', 'Active', 'Sort Order', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCats.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {c.icon && <span style={{ fontSize: 18 }}>{c.icon}</span>}
                          {c.name}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748B', fontFamily: 'monospace', fontSize: 13 }}>{c.slug ?? '—'}</td>
                      <td style={{ ...tdStyle, color: '#0F172A', fontWeight: 600 }}>{c.article_count ?? 0}</td>
                      <td style={tdStyle}>
                        <span style={{ background: c.is_active ? '#DCFCE7' : '#F3F4F6', color: c.is_active ? '#16A34A' : '#6B7280', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748B' }}>{c.sort_order ?? 0}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <SmBtn icon={<Edit2 size={13}/>} label="Edit" color="#2563EB" onClick={() => openEditCat(c)}/>
                          <SmBtn icon={<Trash2 size={13}/>} label="Delete" color="#DC2626" onClick={() => setDeleteCat(c)}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            </div>
          )}
        </div>
      )}

      {/* ── ARTICLES SECTION ── */}
      {section === 'articles' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}/>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles…"
                style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' }}/>
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A' }}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {['All', 'Published', 'Draft'].map((tab) => (
              <button key={tab} onClick={() => setPubFilter(tab)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: pubFilter === tab ? '#0F172A' : '#F1F5F9', color: pubFilter === tab ? '#fff' : '#64748B' }}>{tab}</button>
            ))}
            <button onClick={openAddArt} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              <Plus size={15}/> Add Article
            </button>
          </div>

          {loading ? <LoadingState/> : filteredArts.length === 0 ? (
            <EmptyState icon={<BookOpen size={36}/>} label="No articles yet" action={<button onClick={openAddArt} style={{ marginTop: 12, padding: '8px 20px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Write First Article</button>}/>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Title', 'Category', 'Published', 'Views', 'Date', 'Actions'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredArts.map((a, i) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#0F172A', maxWidth: 280 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                        {a.excerpt && <div style={{ fontSize: 12, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.excerpt}</div>}
                      </td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{a.category_name}</td>
                      <td style={tdStyle}>
                        <span style={{ background: a.is_published ? '#DCFCE7' : '#F3F4F6', color: a.is_published ? '#16A34A' : '#6B7280', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {a.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748B' }}>{a.views ?? 0}</td>
                      <td style={{ ...tdStyle, color: '#64748B', whiteSpace: 'nowrap' }}>{fmtDate(a.created_at)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <SmBtn icon={<Edit2 size={13}/>} label="Edit" color="#2563EB" onClick={() => openEditArt(a)}/>
                          <SmBtn icon={<Trash2 size={13}/>} label="Delete" color="#DC2626" onClick={() => setDeleteArt(a)}/>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            </div>
          )}
        </div>
      )}

      {/* ── Category Modal ── */}
      {catModal && (
        <Modal title={catModal === 'add' ? 'Add Category' : 'Edit Category'} onClose={() => setCatModal(null)}>
          <FormField label="Name *">
            <input value={catForm.name} onChange={(e) => { setCatForm((f) => ({ ...f, name: e.target.value, slug: toSlug(e.target.value) })); }} placeholder="e.g. Getting Started" style={inputS}/>
          </FormField>
          <FormField label="Slug">
            <input value={catForm.slug} onChange={(e) => setCatForm((f) => ({ ...f, slug: e.target.value }))} placeholder="getting-started" style={inputS}/>
          </FormField>
          <FormField label="Description">
            <textarea value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputS, resize: 'vertical' }}/>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Icon (emoji)">
              <input value={catForm.icon} onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))} placeholder="📚" style={inputS}/>
            </FormField>
            <FormField label="Sort Order">
              <input type="number" value={catForm.sort_order} onChange={(e) => setCatForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} style={inputS}/>
            </FormField>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setCatForm((f) => ({ ...f, is_active: !f.is_active }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: catForm.is_active ? '#16A34A' : '#94A3B8', padding: 0 }}>
              {catForm.is_active ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
            </button>
            <span style={{ fontSize: 14, color: '#374151' }}>Active</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <MBtn label="Cancel" onClick={() => setCatModal(null)} variant="secondary"/>
            <MBtn label={saving ? 'Saving…' : 'Save Category'} onClick={saveCat} variant="primary" disabled={saving}/>
          </div>
        </Modal>
      )}

      {/* ── Article Modal ── */}
      {artModal && (
        <Modal title={artModal === 'add' ? 'Add Article' : 'Edit Article'} onClose={() => setArtModal(null)} wide>
          <FormField label="Title *">
            <input value={artForm.title} onChange={(e) => setArtForm((f) => ({ ...f, title: e.target.value }))} placeholder="Article title" style={inputS}/>
          </FormField>
          <FormField label="Category">
            <select value={artForm.category_id} onChange={(e) => setArtForm((f) => ({ ...f, category_id: e.target.value }))} style={inputS}>
              <option value="">— Select Category —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Excerpt">
            <textarea value={artForm.excerpt} onChange={(e) => setArtForm((f) => ({ ...f, excerpt: e.target.value }))} rows={2} placeholder="Short description…" style={{ ...inputS, resize: 'vertical' }}/>
          </FormField>
          <FormField label="Content">
            <textarea value={artForm.content} onChange={(e) => setArtForm((f) => ({ ...f, content: e.target.value }))} rows={6} placeholder="Full article content…" style={{ ...inputS, resize: 'vertical' }}/>
          </FormField>
          <FormField label="Tags (comma-separated)">
            <input value={artForm.tags} onChange={(e) => setArtForm((f) => ({ ...f, tags: e.target.value }))} placeholder="tickets, booking, refund" style={inputS}/>
          </FormField>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setArtForm((f) => ({ ...f, is_published: !f.is_published }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: artForm.is_published ? '#16A34A' : '#94A3B8', padding: 0 }}>
              {artForm.is_published ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
            </button>
            <span style={{ fontSize: 14, color: '#374151' }}>Published</span>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <MBtn label="Cancel" onClick={() => setArtModal(null)} variant="secondary"/>
            <MBtn label={saving ? 'Saving…' : 'Save Article'} onClick={saveArt} variant="primary" disabled={saving}/>
          </div>
        </Modal>
      )}

      {/* ── Delete Category Confirm ── */}
      {deleteCat && (
        <ConfirmDelete
          title="Delete Category"
          message={`Delete "${deleteCat.name}"? All ${deleteCat.article_count ?? 0} articles in this category may be affected.`}
          onConfirm={confirmDeleteCat}
          onCancel={() => setDeleteCat(null)}
          saving={saving}
        />
      )}

      {/* ── Delete Article Confirm ── */}
      {deleteArt && (
        <ConfirmDelete
          title="Delete Article"
          message={`Delete "${deleteArt.title}"? This cannot be undone.`}
          onConfirm={confirmDeleteArt}
          onCancel={() => setDeleteArt(null)}
          saving={saving}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: wide ? 680 : 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20}/></button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function MBtn({ label, onClick, variant, disabled }: { label: string; onClick: () => void; variant: 'primary' | 'secondary'; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: variant === 'primary' ? '#16A34A' : '#F1F5F9', color: variant === 'primary' ? '#fff' : '#0F172A', fontWeight: 600, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1 }}>
      {label}
    </button>
  );
}

function SmBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: `1.5px solid ${color}`, borderRadius: 6, background: 'transparent', color, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
      {icon} {label}
    </button>
  );
}

function ConfirmDelete({ title, message, onConfirm, onCancel, saving }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, maxWidth: 420, width: '100%', padding: 32, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <AlertTriangle size={48} color="#DC2626" style={{ marginBottom: 16 }}/>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>{title}</h2>
        <p style={{ color: '#64748B', fontSize: 14, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#F1F5F9', color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
      <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }}/>
      <p style={{ marginTop: 12 }}>Loading…</p>
    </div>
  );
}

function EmptyState({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
      <div style={{ opacity: 0.4, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{label}</p>
      {action}
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: 600, fontSize: 12, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '14px 16px' };
const inputS: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box' };
