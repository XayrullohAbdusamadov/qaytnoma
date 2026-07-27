'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NetworkBackground from '@/components/NetworkBackground';
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  ArrowLeft,
  X,
  Upload,
  Bookmark
} from 'lucide-react';

export default function AddNotePage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'link'>('text');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('#f59e0b');
  const [sender, setSender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');

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

      window.location.href = '/';
    } catch (err: any) {
      console.error('Error adding item:', err);
      alert('Xatolik yuz berdi: ' + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-16 px-4 md:px-8">
      {/* Network Tech Dynamic Canvas Background */}
      <NetworkBackground />

      <main className="max-w-3xl mx-auto pt-10">
        {/* Header */}
        <header className="mb-8 fade-in">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft size={14} /> Bosh sahifaga qaytish
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center text-rose-400">
                <Bookmark size={22} className="fill-rose-500/20" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">
                Yangi Qayd Qo'shish
              </h1>
              <p className="text-gray-400 text-sm">
                Qaydlaringiz uchun yangi karta yarating. Ular real-time ma'lumotlar bazasida saqlanadi.
              </p>
            </div>
          </div>
        </header>

        {/* Adding Card Form */}
        <div 
          className="bento-card p-6 fade-in flex flex-col justify-between"
          style={{ '--card-accent': color } as React.CSSProperties}
        >
          <div>
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Plus size={18} /> Yangi Qayd Qo'shish Instrumentlari
            </h2>
            
            <form onSubmit={handleAddItem} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Select Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Qayd Turi</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => { setType('text'); setColor('#f59e0b'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        type === 'text' 
                          ? 'bg-amber-500 border-amber-500 text-black' 
                          : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      Matn
                    </button>

                    <button
                      type="button"
                      onClick={() => { setType('image'); setColor('#a855f7'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        type === 'image' 
                          ? 'bg-purple-500 border-purple-500 text-black' 
                          : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      Rasm
                    </button>

                    <button
                      type="button"
                      onClick={() => { setType('link'); setColor('#f43f5e'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        type === 'link' 
                          ? 'bg-rose-500 border-rose-500 text-black' 
                          : 'bg-zinc-900 border-zinc-700 text-gray-400 hover:text-white'
                      }`}
                    >
                      Havola
                    </button>
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
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          uploadMode === 'url' ? 'bg-purple-500 text-black' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        URL Havola
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUploadMode('file'); }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
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
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-black text-gray-300 hover:text-white transition-colors cursor-pointer"
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
                  rows={4}
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
                      className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 border border-zinc-700 text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: color }}
                  >
                    {isSubmitting ? 'Saqlanmoqda...' : "Qaydni Saqlash +"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
