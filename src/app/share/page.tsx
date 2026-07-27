'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Copy,
  Check,
  Send,
  ArrowLeft,
  User,
  Clock,
  Upload,
  X
} from 'lucide-react';

type ShareType = 'text' | 'image' | 'link';

const TYPE_CONFIG = {
  text: {
    label: 'Matn',
    icon: FileText,
    color: '#f59e0b',
    placeholder: 'Ulashmoqchi bo\'lgan matningizni yozing...',
    contentLabel: 'Matn mazmuni'
  },
  image: {
    label: 'Rasm',
    icon: ImageIcon,
    color: '#a855f7',
    placeholder: 'Rasm URL manzilini kiriting...',
    contentLabel: 'Rasm URL'
  },
  link: {
    label: 'Havola',
    icon: LinkIcon,
    color: '#f43f5e',
    placeholder: 'https://example.com',
    contentLabel: 'Havola manzili'
  }
};

const generateShortId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function SharePage() {
  const [type, setType] = useState<ShareType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Image Upload Mode State
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');

  // Image File Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Rasm hajmi juda katta (maksimal 2MB bo'lishi kerak)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setContent(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setIsCreating(true);
      const insertData = {
        type,
        title: title.trim(),
        content: content.trim(),
        image_url: type === 'image' ? content.trim() : null,
        sender: sender.trim() || 'Anonim',
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
      const link = `${window.location.origin}/share/${linkId}`;
      setGeneratedLink(link);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedLink(null);
    setTitle('');
    setContent('');
    setSender('');
    setType('text');
  };

  return (
    <div className="relative min-h-screen pb-16 px-4 md:px-8">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
      </div>

      <main className="max-w-2xl mx-auto pt-10">

        {/* Header */}
        <header className="mb-8 fade-in">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft size={14} /> Qaytnomaga qaytish
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
            Ulashish
          </h1>
          <p className="text-gray-400 text-sm">
            Rasm, matn yoki havola yarating va biriktirma kerak bo'lmasdan to'g'ridan-to'g'ri link ulashing.
          </p>
        </header>

        {/* Success State */}
        {generatedLink ? (
          <div className="bento-card p-8 fade-in" style={{ '--card-accent': cfg.color } as React.CSSProperties}>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${cfg.color}20` }}
              >
                <Icon size={20} style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Ulashish muvaffaqiyatli yaratildi</p>
                <h2 className="text-base font-bold text-white">{title}</h2>
              </div>
            </div>

            {/* Generated Link */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-400">Ulashish havolasi</label>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Qisqartirilgan</span>
              </div>
              <div 
                onClick={handleCopy}
                className="group relative bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-inner flex items-center justify-between gap-4"
                title="Nusxalash uchun bosing"
              >
                <div className="min-w-0 flex-1">
                  <div 
                    className="text-base font-mono font-bold truncate tracking-wide"
                    style={{ color: cfg.color }}
                  >
                    {generatedLink}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-zinc-950 group-hover:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors border border-zinc-800 flex-shrink-0 shadow-sm">
                  {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg"
                style={{
                  backgroundColor: copied ? '#10b981' : cfg.color,
                  color: '#09090b',
                  boxShadow: copied ? '0 10px 15px -3px rgba(16, 185, 129, 0.1)' : `0 10px 15px -3px ${cfg.color}15`
                }}
              >
                {copied ? <><Check size={16} className="stroke-[3px]" /> Havola nusxalandi!</> : <><Copy size={16} /> Havolani nusxalash</>}
              </button>
            </div>

            {/* Preview Card */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 mb-6">
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Ko'rinish</p>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${cfg.color}20` }}
                >
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
                <span className="text-sm font-bold text-white">{title}</span>
              </div>
              {type === 'image' && (
                <div className="w-full h-40 rounded-lg overflow-hidden bg-zinc-800 mb-3">
                  <img src={content} alt={title} className="w-full h-full object-cover" />
                </div>
              )}
              {type === 'text' && (
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{content}</p>
              )}
              {type === 'link' && (
                <div
                  className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg w-fit mb-3"
                  style={{ color: cfg.color, backgroundColor: `${cfg.color}10` }}
                >
                  <LinkIcon size={12} /> {content}
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-gray-500 border-t border-zinc-800 pt-2 mt-1">
                <User size={10} style={{ color: cfg.color }} />
                <span className="text-gray-400 font-semibold">{sender || 'Anonim'}</span>
                <span className="mx-1">•</span>
                <Clock size={10} />
                <span>{new Date().toLocaleString('uz-UZ')}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 text-sm font-medium transition-all"
            >
              Yangi ulashish yaratish
            </button>
          </div>
        ) : (
          /* Create Form */
          <div className="bento-card p-6 fade-in">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Send size={18} /> Yangi ulashish
            </h2>

            <form onSubmit={handleCreate} className="space-y-5">

              {/* Type Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Tur</label>
                <div className="flex gap-2">
                  {(Object.keys(TYPE_CONFIG) as ShareType[]).map((t) => {
                    const c = TYPE_CONFIG[t];
                    const TIcon = c.icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all"
                        style={type === t ? {
                          backgroundColor: `${c.color}20`,
                          borderColor: c.color,
                          color: c.color
                        } : {
                          backgroundColor: 'transparent',
                          borderColor: '#3f3f46',
                          color: '#a1a1aa'
                        }}
                      >
                        <TIcon size={14} /> {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Sarlavha</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ulashish sarlavhasi..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>

              {/* Content */}
              <div>
                {type === 'image' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-gray-400">{cfg.contentLabel}</label>
                      <div className="flex gap-2 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => { setUploadMode('url'); setContent(''); }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                            uploadMode === 'url' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          URL Havola
                        </button>
                        <button
                          type="button"
                          onClick={() => { setUploadMode('file'); setContent(''); }}
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
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={cfg.placeholder}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                      />
                    ) : (
                      <div className="relative border-2 border-dashed border-zinc-700 rounded-xl p-6 hover:border-purple-500/50 transition-colors bg-zinc-900/40 text-center cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                          <Upload size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                          <span className="text-xs text-gray-300 font-medium">Rasm faylini tanlang</span>
                          <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WEBP, GIF (Maks. 2MB)</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <label className="block text-xs font-medium text-gray-400 mb-2">{cfg.contentLabel}</label>
                    {type === 'text' ? (
                      <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={cfg.placeholder}
                        rows={4}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors resize-none"
                      />
                    ) : (
                      <input
                        type="url"
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={cfg.placeholder}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                      />
                    )}
                  </>
                )}
              </div>

              {/* Image Preview */}
              {type === 'image' && content && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                  <img src={content} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setContent('')}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black text-gray-300 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Sender */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Yuboruvchi ismi</label>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Ismingiz (ixtiyoriy)..."
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isCreating || !title.trim() || !content.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ backgroundColor: cfg.color, color: '#09090b' }}
              >
                {isCreating ? 'Yaratilmoqda...' : <><Send size={16} /> Link yaratish</>}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
