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
  Bookmark,
  Upload
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

const generateShortId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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

  // Image Upload Mode States
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [shareUploadMode, setShareUploadMode] = useState<'url' | 'file'>('url');
  const [editUploadMode, setEditUploadMode] = useState<'url' | 'file'>('url');

  // Image File Upload Helper
  const handleImageFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Rasm hajmi juda katta (maksimal 2MB bo'lishi kerak)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Share individual card data
  const handleShareCard = async (item: QaytnomaItem) => {
    try {
      setSharingItemId(item.id);
      
      const insertData = {
        type: item.type,
        title: item.title,
        content: item.type === 'image' ? item.image_url : item.content,
        image_url: item.type === 'image' ? item.image_url : null,
        sender: item.sender || 'Anonim',
        short_id: generateShortId(),
      };

      let data: any = null;
      let error = null;

      // Insert into shared_items to create unique link for this saved item
      const res = await supabase
        .from('shared_items')
        .insert([insertData])
        .select('short_id, id')
        .single();

      error = res.error;
      data = res.data;

      if (error && error.message.includes('short_id')) {
        // Fallback: retry without short_id
        const fallbackInsert = { ...insertData };
        delete (fallbackInsert as any).short_id;
        
        const retryRes = await supabase
          .from('shared_items')
          .insert([fallbackInsert])
          .select('id')
          .single();
        
        if (retryRes.error) throw retryRes.error;
        data = retryRes.data as any;
      } else if (error) {
        throw error;
      }

      const linkId = data.short_id || data.id;
      // Copy the dynamic vercel share link
      const link = `https://qaydnoma-six.vercel.app/share/${linkId}`;
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
      const insertData = {
        type: shareType,
        title: shareTitle.trim(),
        content: shareContent.trim(),
        image_url: shareType === 'image' ? shareContent.trim() : null,
        sender: shareSender.trim() || 'Anonim',
        short_id: generateShortId(),
      };

      let data: any = null;
      let error = null;

      const res = await supabase
        .from('shared_items')
        .insert([insertData])
        .select('short_id, id')
        .single();

      error = res.error;
      data = res.data;

      if (error && error.message.includes('short_id')) {
        // Fallback: retry without short_id
        const fallbackInsert = { ...insertData };
        delete (fallbackInsert as any).short_id;

        const retryRes = await supabase
          .from('shared_items')
          .insert([fallbackInsert])
          .select('id')
          .single();

        if (retryRes.error) throw retryRes.error;
        data = retryRes.data as any;
      } else if (error) {
        throw error;
      }

      const linkId = data.short_id || data.id;
      const link = `https://qaydnoma-six.vercel.app/share/${linkId}`;
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
    if (item.image_url && item.image_url.startsWith('data:image/')) {
      setEditUploadMode('file');
    } else {
      setEditUploadMode('url');
    }
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
        {/* Bento Grid Layout (2-Column Asymmetric Sketch Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column (spans 7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            
            {/* Card 4: Yangi Qayd Qo'shish Form */}
            <div className="bento-card p-6 fade-in w-full">
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-gray-400">Rasm yuklash usuli</label>
                      <div className="flex gap-2 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => { setUploadMode('url'); }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            uploadMode === 'url' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          URL Havola
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUploadMode('file'); }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            uploadMode === 'file' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Fayl yuklash
                        </button>
                      </div>
                    </div>

                    {uploadMode === 'url' ? (
                      <input 
                        type="url"
                        required={!imageUrl}
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none transition-colors"
                      />
                    ) : (
                      <div className="relative border-2 border-dashed border-zinc-700 rounded-xl p-4 hover:border-purple-500/50 transition-colors bg-zinc-900/40 text-center cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, setImageUrl)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                          <Upload size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <span className="text-xs text-gray-300 font-medium">Rasm faylini tanlang</span>
                          <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WEBP, GIF (Maks. 2MB)</span>
                        </div>
                      </div>
                    )}

                    {imageUrl && (
                      <div className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-black text-gray-300 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
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
            
            {/* Card 1: Bu nima qiladi? */}
            <div className="bento-card p-4.5 fade-in flex flex-col justify-between min-h-[130px] w-full">
              <div>
                <div className="icon-badge" style={{ '--badge-color': '#10b981', width: '28px', height: '28px' } as React.CSSProperties}>
                  <Info size={15} />
                </div>
                <h2 className="text-sm font-extrabold text-white mb-1">Bu nima qiladi?</h2>
                <p className="text-gray-455 text-[11px] leading-relaxed">
                  Qaytnoma orqali matnlar, rasmlar va havolalarni Bento uslubida vizual saqlashingiz va Telegram/Emaildan foydalanmasdan maxsus link orqali ulashingiz mumkin.
                </p>
              </div>
              <div className="text-[9px] text-gray-500 mt-2 font-mono">
                ★ Premium Vizual Layout • Direct Link Share
              </div>
            </div>

            {/* Card 2: So'rovnoma */}
            <div className="bento-card p-4.5 fade-in flex flex-col justify-between min-h-[130px] w-full" style={{ animationDelay: '0.1s' }}>
              <div>
                <div className="icon-badge" style={{ '--badge-color': '#a855f7', width: '28px', height: '28px' } as React.CSSProperties}>
                  <Sliders size={15} />
                </div>
                <h2 className="text-sm font-extrabold text-white mb-1">So'rovnoma</h2>
                <p className="text-gray-455 text-[11px] mb-2">
                  Nimalarni saqlamoqchisiz? Kerakli turlarni belgilang:
                </p>
                
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => saveSurvey({ ...survey, text: !survey.text })}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      survey.text 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                        : 'bg-zinc-800 border-zinc-700 text-gray-400'
                    }`}
                  >
                    <FileText size={10} /> Matn
                  </button>
                  <button 
                    onClick={() => saveSurvey({ ...survey, image: !survey.image })}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      survey.image 
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                        : 'bg-zinc-800 border-zinc-700 text-gray-400'
                    }`}
                  >
                    <ImageIcon size={10} /> Rasm
                  </button>
                  <button 
                    onClick={() => saveSurvey({ ...survey, link: !survey.link })}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all flex items-center gap-1 ${
                      survey.link 
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' 
                        : 'bg-zinc-800 border-zinc-700 text-gray-400'
                    }`}
                  >
                    <LinkIcon size={10} /> Havola
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (spans 5 cols on desktop) */}
          <div className="lg:col-span-5 flex">
            
            {/* Card 3: Direct Link Ulashish / Share Bento Widget */}
            <div className="bento-card p-6 fade-in w-full flex flex-col justify-between h-full" style={{ '--card-accent': '#f43f5e', animationDelay: '0.15s' } as React.CSSProperties}>
              <div>
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
                  <div className="space-y-4 mt-3 fade-in">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                        Link tayyor!
                      </span>
                      <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 font-extrabold">
                        Qisqa Havola
                      </span>
                    </div>

                    <div 
                      onClick={copyShareLink}
                      className="group relative bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-rose-500/40 rounded-xl p-3.5 transition-all duration-200 cursor-pointer shadow-inner flex items-center justify-between gap-3"
                      title="Nusxalash uchun bosing"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mb-0.5">Havola manzili</span>
                        <div className="text-sm font-mono font-bold text-rose-400 truncate tracking-wide">
                          {generatedShareUrl}
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 group-hover:bg-rose-500/10 flex items-center justify-center text-zinc-400 group-hover:text-rose-400 transition-colors border border-zinc-800 group-hover:border-rose-500/20 flex-shrink-0 shadow-sm">
                        {copiedShare ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={copyShareLink}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                          copiedShare 
                            ? 'bg-emerald-500 text-black shadow-emerald-500/10' 
                            : 'bg-rose-500 hover:bg-rose-600 text-black'
                        }`}
                      >
                        {copiedShare ? (
                          <>
                            <Check size={14} className="stroke-[3px]" />
                            <span>Nusxalandi!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Nusxalash</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setGeneratedShareUrl(null);
                          setShareTitle('');
                          setShareContent('');
                          setShareSender('');
                        }}
                        className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-all active:scale-95"
                        title="Yangi havola yaratish"
                      >
                        <RotateCcw size={13} />
                        <span>Qayta</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateShare} className="space-y-2.5 mt-2">
                    <div className="flex gap-1.5 p-0.5 bg-zinc-950 rounded-lg border border-zinc-850">
                      {(['text', 'image', 'link'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setShareType(t);
                            setShareContent('');
                          }}
                          className={`flex-1 py-1 rounded-md text-[10px] font-bold capitalize transition-all ${
                            shareType === t 
                              ? 'bg-rose-500 text-black' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {t === 'text' ? 'Matn' : t === 'image' ? 'Rasm' : 'Havola'}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Ulashish sarlavhasi..."
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    />

                    {shareType === 'image' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-semibold">Yuklash turi</span>
                          <div className="flex gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-850">
                            <button
                              type="button"
                              onClick={() => { setShareUploadMode('url'); setShareContent(''); }}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                shareUploadMode === 'url' ? 'bg-rose-500 text-black' : 'text-gray-400'
                              }`}
                            >
                              URL
                            </button>
                            <button
                              type="button"
                              onClick={() => { setShareUploadMode('file'); setShareContent(''); }}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                                shareUploadMode === 'file' ? 'bg-rose-500 text-black' : 'text-gray-400'
                              }`}
                            >
                              Fayl
                            </button>
                          </div>
                        </div>

                        {shareUploadMode === 'url' ? (
                          <input
                            type="url"
                            required
                            placeholder="Rasm URL manzili..."
                            value={shareContent}
                            onChange={(e) => setShareContent(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                          />
                        ) : (
                          <div className="relative border border-dashed border-zinc-750 hover:border-rose-500 rounded-lg p-3 bg-zinc-900/40 text-center cursor-pointer group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageFileChange(e, setShareContent)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                              <Upload size={14} className="text-gray-400 group-hover:text-rose-450 transition-colors" />
                              <span className="text-[10px] text-gray-300 font-medium">Rasm faylini tanlang</span>
                            </div>
                          </div>
                        )}

                        {shareContent && (
                          <div className="relative w-full h-16 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
                            <img src={shareContent} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setShareContent('')}
                              className="absolute top-1 right-1 p-0.5 rounded bg-black/60 hover:bg-black text-gray-300 hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder={shareType === 'link' ? 'https://...' : 'Matn...'}
                        value={shareContent}
                        onChange={(e) => setShareContent(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-rose-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                      />
                    )}

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
              
              <div className="text-[10px] text-gray-500 mt-6 font-mono border-t border-zinc-800/50 pt-3">
                ★ Tezkor ulashish tizimi • Havolalar xavfsiz va qisqa
              </div>
            </div>
            
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-gray-400">Rasm yuklash usuli</label>
                    <div className="flex gap-2 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => { setEditUploadMode('url'); }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          editUploadMode === 'url' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        URL Havola
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditUploadMode('file'); }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          editUploadMode === 'file' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Fayl yuklash
                      </button>
                    </div>
                  </div>

                  {editUploadMode === 'url' ? (
                    <input
                      type="url"
                      value={editForm.image_url}
                      onChange={(e) => setEditForm(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                      placeholder="https://..."
                    />
                  ) : (
                    <div className="relative border-2 border-dashed border-zinc-700 rounded-xl p-4 hover:border-purple-500/50 transition-colors bg-zinc-900/40 text-center cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileChange(e, (val) => setEditForm(prev => ({ ...prev, image_url: val })))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                        <Upload size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                        <span className="text-xs text-gray-300 font-medium">Rasm faylini tanlang</span>
                        <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WEBP, GIF (Maks. 2MB)</span>
                      </div>
                    </div>
                  )}

                  {editForm.image_url && (
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
                      <img src={editForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, image_url: '' }))}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-black text-gray-300 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
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
