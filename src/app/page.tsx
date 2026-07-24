'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import NetworkBackground from '@/components/NetworkBackground';
import { 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Trash2, 
  Sliders, 
  Plus, 
  Check, 
  ExternalLink,
  Info,
  User,
  Pencil,
  X,
  Share2,
  Copy,
  Send,
  Globe,
  RotateCcw,
  Bookmark
} from 'lucide-react';

interface QaytnomaItem {
  id: string;
  title: string;
  content: string | null;
  type: 'text' | 'image' | 'link';
  image_url: string | null;
  color: string;
  icon: string;
  sender: string;
  created_at: string;
}

export default function Home() {
  const [items, setItems] = useState<QaytnomaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Survey State (Vaqt va Vazifalar olib tashlandi, faqat Matn, Rasm, Havola qoldi)
  const [survey, setSurvey] = useState({
    text: true,
    image: true,
    link: true,
  });

  // Main Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'link'>('text');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [sender, setSender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Share Form State (Bento Share block)
  const [shareType, setShareType] = useState<'text' | 'image' | 'link'>('text');
  const [shareTitle, setShareTitle] = useState('');
  const [shareContent, setShareContent] = useState('');
  const [shareSender, setShareSender] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Vercel link copy state
  const vercelUrl = 'https://qaydnoma-six.vercel.app/';
  const [copiedVercel, setCopiedVercel] = useState(false);

  // Card Share states
  const [sharingItemId, setSharingItemId] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<QaytnomaItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', sender: '', image_url: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Share individual card data
  const handleShareCard = async (item: QaytnomaItem) => {
    try {
      setSharingItemId(item.id);
      
      // Insert into shared_items to create unique link for this saved item
      const { data, error } = await supabase
        .from('shared_items')
        .insert([{
          type: item.type,
          title: item.title,
          content: item.type === 'image' ? item.image_url : item.content,
          image_url: item.type === 'image' ? item.image_url : null,
          sender: item.sender || 'Anonim',
        }])
        .select('id')
        .single();

      if (error) throw error;

      // Copy the dynamic vercel share link
      const link = `https://qaydnoma-six.vercel.app/share/${data.id}`;
      await navigator.clipboard.writeText(link);

      setCopiedItemId(item.id);
      setTimeout(() => setCopiedItemId(null), 2000);
    } catch (err) {
      console.error('Error sharing card:', err);
    } finally {
      setSharingItemId(null);
    }
  };

  // Fetch Items from Supabase
  const fetchItems = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const { data, error } = await supabase
        .from('qaytnoma_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setErrorState(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const savedSurvey = localStorage.getItem('qaytnoma_survey');
    if (savedSurvey) {
      try {
        const parsed = JSON.parse(savedSurvey);
        setSurvey({
          text: parsed.text ?? true,
          image: parsed.image ?? true,
          link: parsed.link ?? true,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveSurvey = (newSurvey: typeof survey) => {
    setSurvey(newSurvey);
    localStorage.setItem('qaytnoma_survey', JSON.stringify(newSurvey));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      let iconName = 'FileText';
      if (type === 'image') iconName = 'ImageIcon';
      if (type === 'link') iconName = 'LinkIcon';

      const { error } = await supabase
        .from('qaytnoma_items')
        .insert([{
          title: title.trim(),
          content: content.trim() || null,
          type,
          image_url: type === 'image' ? (imageUrl.trim() || null) : null,
          color,
          icon: iconName,
          sender: sender.trim() || 'Anonim',
          is_completed: false
        }]);

      if (error) throw error;

      setTitle('');
      setContent('');
      setImageUrl('');
      setSender('');
      fetchItems();
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Share Creator Handler
  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTitle.trim() || !shareContent.trim()) return;

    try {
      setIsSharing(true);
      const { data, error } = await supabase
        .from('shared_items')
        .insert([{
          type: shareType,
          title: shareTitle.trim(),
          content: shareContent.trim(),
          image_url: shareType === 'image' ? shareContent.trim() : null,
          sender: shareSender.trim() || 'Anonim',
        }])
        .select('id')
        .single();

      if (error) throw error;

      const link = `https://qaydnoma-six.vercel.app/share/${data.id}`;
      setGeneratedShareUrl(link);
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const copyVercelLink = async () => {
    await navigator.clipboard.writeText(vercelUrl);
    setCopiedVercel(true);
    setTimeout(() => setCopiedVercel(false), 2000);
  };

  const copyShareLink = async () => {
    if (!generatedShareUrl) return;
    await navigator.clipboard.writeText(generatedShareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    try {
      setItems(prev => prev.filter(item => item.id !== id));
      const { error } = await supabase.from('qaytnoma_items').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting item:', err);
      fetchItems();
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: QaytnomaItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      content: item.content || '',
      sender: item.sender || '',
      image_url: item.image_url || '',
    });
  };

  // Save Edit to Supabase
  const handleSaveEdit = async () => {
    if (!editingItem || !editForm.title.trim()) return;
    try {
      setIsSavingEdit(true);
      const { error } = await supabase
        .from('qaytnoma_items')
        .update({
          title: editForm.title,
          content: editForm.content || null,
          sender: editForm.sender || 'Anonim',
          image_url: editingItem.type === 'image' ? editForm.image_url : editingItem.image_url,
        })
        .eq('id', editingItem.id);
      if (error) throw error;
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      console.error('Edit error:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderIcon = (iconName: string, color: string) => {
    const props = { size: 20, style: { color } };
    switch (iconName) {
      case 'FileText': return <FileText {...props} />;
      case 'ImageIcon': return <ImageIcon {...props} />;
      case 'LinkIcon': return <LinkIcon {...props} />;
      default: return <FileText {...props} />;
    }
  };

  const filteredItems = items.filter(item => {
    if (item.type === 'text' && !survey.text) return false;
    if (item.type === 'image' && !survey.image) return false;
    if (item.type === 'link' && !survey.link) return false;
    return true;
  });

  return (
    <div className="relative min-h-screen pb-16 px-4 md:px-8">
      {/* Network Tech Dynamic Canvas Background */}
      <NetworkBackground />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto pt-8">
        
        {/* Header Block with Vercel Badge */}
        <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 fade-in">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-rose-400">
                  <Bookmark size={22} className="fill-rose-500/20" />
                </div>
              </div>
              <span>Qaydnoma</span>
            </h1>
            <p className="text-gray-400 max-w-xl text-sm">
              Bento uslubidagi zamonaviy eslatmalar va qaydlar daftari. Real-time saqlash va linklar ulashish tizimi.
            </p>
          </div>

          {/* Vercel Live Link Block */}
          <div className="bg-zinc-900/80 border border-zinc-700/80 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3 shadow-xl backdrop-blur-xl transition-all duration-300">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold shadow-inner">
              ▲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Vercel Live</span>
              </div>
              <a
                href={vercelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono font-semibold text-white hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                qaydnoma-six.vercel.app <ExternalLink size={11} />
              </a>
            </div>
            <button
              onClick={copyVercelLink}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-emerald-500 hover:text-black text-gray-300 transition-all text-xs flex items-center gap-1 border border-zinc-700/80 font-semibold"
              title="Vercel linkini nusxalash"
            >
              {copiedVercel ? <Check size={14} className="text-black" /> : <Copy size={14} />}
            </button>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          
          {/* Card 1: Bu nima qiladi? (Col span 4) */}
          <div className="bento-card col-span-12 md:col-span-4 p-6 min-h-[200px] fade-in">
            <div>
              <div className="icon-badge" style={{ '--badge-color': '#10b981' } as React.CSSProperties}>
                <Info size={20} />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Bu nima qiladi?</h2>
              <p className="text-gray-400 text-xs leading-relaxed">
                Qaytnoma orqali matnlar, rasmlar va havolalarni Bento uslubida vizual saqlashingiz va Telegram/Emaildan foydalanmasdan maxsus link orqali ulashingiz mumkin.
              </p>
            </div>
            <div className="text-[10px] text-gray-500 mt-4 font-mono">
              ★ Premium Vizual Layout • Direct Link Share
            </div>
          </div>

          {/* Card 2: So'rovnoma (Col span 4) */}
          <div className="bento-card col-span-12 md:col-span-4 p-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <div>
              <div className="icon-badge" style={{ '--badge-color': '#a855f7' } as React.CSSProperties}>
                <Sliders size={20} />
              </div>
              <h2 className="text-lg font-bold text-white mb-1">So'rovnoma</h2>
              <p className="text-gray-400 text-xs mb-3">
                Nimalarni saqlamoqchisiz? Kerakli turlarni belgilang:
              </p>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => saveSurvey({ ...survey, text: !survey.text })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    survey.text 
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400'
                  }`}
                >
                  <FileText size={13} /> Matn
                </button>
                <button 
                  onClick={() => saveSurvey({ ...survey, image: !survey.image })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    survey.image 
                      ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400'
                  }`}
                >
                  <ImageIcon size={13} /> Rasm
                </button>
                <button 
                  onClick={() => saveSurvey({ ...survey, link: !survey.link })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    survey.link 
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400'
                  }`}
                >
                  <LinkIcon size={13} /> Havola
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Direct Link Ulashish / Share Bento Widget (Col span 4) */}
          <div className="bento-card col-span-12 md:col-span-4 p-6 fade-in" style={{ '--card-accent': '#f43f5e', animationDelay: '0.15s' } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="icon-badge" style={{ '--badge-color': '#f43f5e', '--badge-bg': '#f43f5e15' } as React.CSSProperties}>
                  <Share2 size={18} />
                </div>
                <h2 className="text-lg font-bold text-white">Direct Link Ulashish</h2>
              </div>
              <a href="/share" className="text-xs text-rose-400 hover:underline flex items-center gap-1">
                To'liq sahifa <ExternalLink size={10} />
              </a>
            </div>

            {generatedShareUrl ? (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={14} /> Link tayyor!
                </p>
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-[11px] font-mono text-gray-300 truncate">
                  {generatedShareUrl}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyShareLink}
                    className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    {copiedShare ? <><Check size={14} /> Nusxalandi!</> : <><Copy size={14} /> Nusxalash</>}
                  </button>
                  <button
                    onClick={() => {
                      setGeneratedShareUrl(null);
                      setShareTitle('');
                      setShareContent('');
                      setShareSender('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95"
                    title="Formani tozalash"
                  >
                    <RotateCcw size={13} /> Tozalash
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateShare} className="space-y-2.5 mt-2">
                <input
                  type="text"
                  required
                  placeholder="Ulashish sarlavhasi..."
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder={shareType === 'image' ? 'Rasm URL...' : shareType === 'link' ? 'https://...' : 'Matn...'}
                  value={shareContent}
                  onChange={(e) => setShareContent(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSharing || !shareTitle.trim() || !shareContent.trim()}
                    className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 font-bold text-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSharing ? 'Yaratilmoqda...' : <><Send size={12} /> Link Yaratish</>}
                  </button>
                  {(shareTitle || shareContent) && (
                    <button
                      type="button"
                      onClick={() => { setShareTitle(''); setShareContent(''); setShareSender(''); }}
                      className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/80 text-gray-300 hover:text-white rounded-xl text-xs flex items-center justify-center gap-1 font-medium transition-all"
                      title="Tozalash"
                    >
                      <RotateCcw size={13} />
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Card 4: Yangi Qayd Qo'shish Form (Col span 12) */}
          <div className="bento-card col-span-12 p-6 fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={18} /> Yangi Qayd Qo'shish
            </h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Select Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Qayd Turi</label>
                  <div className="flex flex-wrap gap-2">
                    {survey.text && (
                      <button
                        type="button"
                        onClick={() => { setType('text'); setColor('#f59e0b'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          type === 'text' 
                            ? 'bg-amber-500 border-amber-500 text-black' 
                            : 'bg-zinc-900 border-zinc-700 text-gray-400'
                        }`}
                      >
                        Matn
                      </button>
                    )}

                    {survey.image && (
                      <button
                        type="button"
                        onClick={() => { setType('image'); setColor('#a855f7'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          type === 'image' 
                            ? 'bg-purple-500 border-purple-500 text-black' 
                            : 'bg-zinc-900 border-zinc-700 text-gray-400'
                        }`}
                      >
                        Rasm
                      </button>
                    )}

                    {survey.link && (
                      <button
                        type="button"
                        onClick={() => { setType('link'); setColor('#f43f5e'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          type === 'link' 
                            ? 'bg-rose-500 border-rose-500 text-black' 
                            : 'bg-zinc-900 border-zinc-700 text-gray-400'
                        }`}
                      >
                        Havola
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Sarlavha</label>
                  <input 
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Mavzu yoki sarlavha..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                  />
                </div>

                {/* Sender */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Yuboruvchi ismi</label>
                  <input 
                    type="text"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="Ismingiz..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                  />
                </div>

              </div>

              {/* Dynamic input based on type */}
              {type === 'image' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Rasm URL Manzili</label>
                  <input 
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                  />
                </div>
              )}

              {/* Content Description */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  {type === 'link' ? 'Havola URL manzili' : 'Batafsil matn / Tavsif'}
                </label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={type === 'link' ? 'https://example.com' : "Qayd mazmunini yozing..."}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Rang:</span>
                  {['#f59e0b', '#3b82f6', '#a855f7', '#10b981', '#f43f5e', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: color }}
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash +'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Saved Notes Section Header */}
        <div className="mt-12 mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Saqlangan Qaydlar
          </h2>
        </div>

        {/* Notes Bento List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-gray-500 text-sm">
            Hozircha qaydlar mavjud emas. Yuqoridagi formadan qo'shing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="bento-card card-highlight relative flex flex-col justify-between p-6 min-h-[200px] transition-all duration-300"
                style={{ '--card-accent': item.color } as React.CSSProperties}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="icon-badge" style={{ '--badge-color': item.color, '--badge-bg': `${item.color}15` } as React.CSSProperties}>
                    {renderIcon(item.icon, item.color)}
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Share Card Button */}
                    <button
                      onClick={() => handleShareCard(item)}
                      className={`px-2.5 py-1 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        copiedItemId === item.id 
                          ? 'bg-emerald-500 border-emerald-500 text-black font-bold' 
                          : 'bg-zinc-900/80 border-zinc-700 hover:border-rose-500 text-gray-300 hover:text-white'
                      }`}
                      title={copiedItemId === item.id ? "Nusxalandi!" : "Vercel Share link yaratish va nusxalash"}
                      disabled={sharingItemId === item.id}
                    >
                      {copiedItemId === item.id ? (
                        <>
                          <Check size={12} />
                          <span>Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={12} className={sharingItemId === item.id ? 'animate-spin' : ''} />
                          <span>Link olish</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 border border-zinc-700 hover:border-blue-500 rounded-lg text-gray-400 hover:text-blue-400 transition-all"
                      title="Tahrirlash"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 border border-zinc-700 hover:border-rose-500 rounded-lg text-gray-400 hover:text-rose-500 transition-all"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1">
                    {item.title}
                  </h3>

                  {item.type === 'image' && item.image_url && (
                    <div className="w-full h-32 rounded-lg overflow-hidden my-2 border border-zinc-800 bg-zinc-900">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {item.content && (
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                      {item.content}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-500 border-t border-zinc-900 pt-3">
                  <div className="flex items-center gap-1">
                    <User size={10} style={{ color: item.color }} />
                    <span className="font-semibold text-gray-400">{item.sender || 'Anonim'}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {item.type === 'link' && item.content && (
                    <a 
                      href={item.content.startsWith('http') ? item.content : `https://${item.content}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-1 hover:text-white font-medium transition-colors"
                    >
                      O'tish <ExternalLink size={10} />
                    </a>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2 font-semibold text-white">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-black shadow-md">
              <Bookmark size={14} className="fill-black" />
            </div>
            <span className="text-sm tracking-tight font-extrabold">Qaydnoma</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400 font-normal">Yaratuvchi: <strong className="text-gray-200">Hayrulloh Abdusamadov</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://t.me/HayrullohAdusamadov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:border-blue-500/60 font-medium transition-all shadow-sm hover:scale-105 active:scale-95"
            >
              <Send size={12} /> Telegram kanal: @HayrullohAdusamadov
            </a>
          </div>
        </footer>

      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditingItem(null); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: '#18181b', borderColor: `${editingItem.color}40` }}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${editingItem.color}20` }}
                >
                  <Pencil size={16} style={{ color: editingItem.color }} />
                </div>
                <h3 className="text-base font-bold text-white">Qaydni tahrirlash</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg border border-zinc-700 text-gray-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Sarlavha</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Mazmun</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none resize-none"
                  rows={3}
                />
              </div>

              {editingItem.type === 'image' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Rasm URL</label>
                  <input
                    type="url"
                    value={editForm.image_url}
                    onChange={(e) => setEditForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Yuboruvchi ismi</label>
                <input
                  type="text"
                  value={editForm.sender}
                  onChange={(e) => setEditForm(prev => ({ ...prev, sender: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-gray-400 text-xs font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editForm.title.trim()}
                className="px-5 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: editingItem.color, color: '#09090b' }}
              >
                {isSavingEdit ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
