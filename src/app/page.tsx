'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  CheckSquare, 
  Link as LinkIcon, 
  Trash2, 
  Sliders, 
  Plus, 
  Check, 
  HelpCircle, 
  ExternalLink,
  Info,
  User
} from 'lucide-react';

interface QaytnomaItem {
  id: string;
  title: string;
  content: string | null;
  type: 'text' | 'image' | 'datetime' | 'todo' | 'link';
  image_url: string | null;
  color: string;
  icon: string;
  is_completed: boolean;
  target_time: string | null;
  sender: string;
  created_at: string;
}

export default function Home() {
  const [items, setItems] = useState<QaytnomaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Survey State
  const [survey, setSurvey] = useState({
    text: true,
    image: true,
    datetime: true,
    todo: true,
    link: true,
  });

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'text' | 'image' | 'datetime' | 'todo' | 'link'>('text');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('#f59e0b'); // Default Amber
  const [targetTime, setTargetTime] = useState('');
  const [sender, setSender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    // Load survey from localStorage if available
    const savedSurvey = localStorage.getItem('qaytnoma_survey');
    if (savedSurvey) {
      try {
        setSurvey(JSON.parse(savedSurvey));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveSurvey = (newSurvey: typeof survey) => {
    setSurvey(newSurvey);
    localStorage.setItem('qaytnoma_survey', JSON.stringify(newSurvey));
  };

  const handleTypeChange = (newType: typeof type) => {
    setType(newType);
    // Update default colors for better UX
    switch (newType) {
      case 'text': setColor('#f59e0b'); break; // Amber
      case 'image': setColor('#a855f7'); break; // Purple
      case 'datetime': setColor('#3b82f6'); break; // Blue
      case 'todo': setColor('#10b981'); break; // Emerald
      case 'link': setColor('#f43f5e'); break; // Rose
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      let finalIcon = 'FileText';
      switch (type) {
        case 'image': finalIcon = 'ImageIcon'; break;
        case 'datetime': finalIcon = 'Clock'; break;
        case 'todo': finalIcon = 'CheckSquare'; break;
        case 'link': finalIcon = 'LinkIcon'; break;
      }

      const { data, error } = await supabase
        .from('qaytnoma_items')
        .insert([
          {
            title,
            content: content || null,
            type,
            image_url: type === 'image' ? (imageUrl || 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop') : null,
            color,
            icon: finalIcon,
            is_completed: false,
            target_time: type === 'datetime' ? (targetTime || null) : null,
            sender: sender.trim() || 'Anonim',
          }
        ])
        .select();

      if (error) throw error;
      
      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setTargetTime('');
      fetchItems();
    } catch (err) {
      console.error('Error adding item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Completion
  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setItems(prev => prev.map(item => item.id === id ? { ...item, is_completed: !currentStatus } : item));
      
      const { error } = await supabase
        .from('qaytnoma_items')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling status:', err);
      // Revert if error
      fetchItems();
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string) => {
    try {
      // Optimistic update
      setItems(prev => prev.filter(item => item.id !== id));

      const { error } = await supabase
        .from('qaytnoma_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting item:', err);
      fetchItems();
    }
  };

  // Render Icon helper
  const renderIcon = (iconName: string, color: string) => {
    const props = { size: 20, style: { color } };
    switch (iconName) {
      case 'FileText': return <FileText {...props} />;
      case 'ImageIcon': return <ImageIcon {...props} />;
      case 'Clock': return <Clock {...props} />;
      case 'CheckSquare': return <CheckSquare {...props} />;
      case 'LinkIcon': return <LinkIcon {...props} />;
      default: return <FileText {...props} />;
    }
  };

  // Filter items based on survey settings
  const filteredItems = items.filter(item => {
    if (item.type === 'text' && !survey.text) return false;
    if (item.type === 'image' && !survey.image) return false;
    if (item.type === 'datetime' && !survey.datetime) return false;
    if (item.type === 'todo' && !survey.todo) return false;
    if (item.type === 'link' && !survey.link) return false;
    return true;
  });

  return (
    <div className="relative min-height-screen pb-16 px-4 md:px-8">
      {/* Harakatlanuvchi Fon Animatsiyasi */}
      <div className="background-animation">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto pt-8">
        
        {/* Header Block */}
        <header className="mb-10 text-center md:text-left fade-in">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">
            Qaytnoma
          </h1>
          <p className="text-gray-400 max-w-xl">
            Bento uslubidagi zamonaviy eslatmalar va qaydlar daftari. Supabase orqali real-time saqlash tizimi.
          </p>
        </header>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          
          {/* Card 1: Nima bu / Hero (Col span 6, Row span 1) */}
          <div className="bento-card col-span-12 md:col-span-6 p-6 min-h-[220px] fade-in">
            <div>
              <div className="icon-badge" style={{ '--badge-color': '#10b981' } as React.CSSProperties}>
                <Info size={20} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Bu nima qiladi?</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Qaytnoma orqali siz matnlar, rasmlar, havolalar, vazifalar va muhim vaqt chegaralarini bir joyda Bento uslubida vizual tarzda saqlashingiz mumkin. Har bir ma'lumot turi o'z rang va ikonkasiga ega.
              </p>
            </div>
            <div className="text-xs text-gray-500 mt-4">
              Premium vizual dizayn • Tez va qulay
            </div>
          </div>

          {/* Card 2: So'rovnoma / Survey (Col span 12 or 6) */}
          <div className="bento-card col-span-12 md:col-span-6 p-6 fade-in" style={{ animationDelay: '0.1s' }}>
            <div>
              <div className="icon-badge" style={{ '--badge-color': '#a855f7' } as React.CSSProperties}>
                <Sliders size={20} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">So'rovnoma: Nimalarni saqlamoqchisiz?</h2>
              <p className="text-gray-400 text-sm mb-4">
                Quyidagilardan qaysi birlarini ishlatishni istasangiz belgilang. Shunga ko'ra interfeys moslashadi:
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button 
                  onClick={() => saveSurvey({ ...survey, text: !survey.text })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                    survey.text 
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <FileText size={14} /> Matn
                </button>
                <button 
                  onClick={() => saveSurvey({ ...survey, image: !survey.image })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                    survey.image 
                      ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <ImageIcon size={14} /> Rasm
                </button>
                <button 
                  onClick={() => saveSurvey({ ...survey, datetime: !survey.datetime })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                    survey.datetime 
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Clock size={14} /> Vaqt
                </button>
                <button 
                  onClick={() => saveSurvey({ ...survey, todo: !survey.todo })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                    survey.todo 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <CheckSquare size={14} /> Vazifalar
                </button>
                <button 
                  onClick={() => saveSurvey({ ...survey, link: !survey.link })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 ${
                    survey.link 
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' 
                      : 'bg-zinc-800 border-zinc-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <LinkIcon size={14} /> Havolalar
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Ma'lumot qo'shish / Form (Col span 12) */}
          <div className="bento-card col-span-12 p-6 fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus size={20} /> Yangi Qayd Qo'shish
            </h2>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Select Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Qayd Turi</label>
                  <div className="flex flex-wrap gap-2">
                    {survey.text && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('text')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          type === 'text' ? 'bg-amber-500 text-black border-amber-500' : 'bg-zinc-800 border-zinc-700 text-white'
                        }`}
                      >
                        Matn
                      </button>
                    )}
                    {survey.image && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('image')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          type === 'image' ? 'bg-purple-500 text-black border-purple-500' : 'bg-zinc-800 border-zinc-700 text-white'
                        }`}
                      >
                        Rasm
                      </button>
                    )}
                    {survey.datetime && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('datetime')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          type === 'datetime' ? 'bg-blue-500 text-black border-blue-500' : 'bg-zinc-800 border-zinc-700 text-white'
                        }`}
                      >
                        Vaqt
                      </button>
                    )}
                    {survey.todo && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('todo')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          type === 'todo' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-800 border-zinc-700 text-white'
                        }`}
                      >
                        Vazifa
                      </button>
                    )}
                    {survey.link && (
                      <button
                        type="button"
                        onClick={() => handleTypeChange('link')}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          type === 'link' ? 'bg-rose-500 text-black border-rose-500' : 'bg-zinc-800 border-zinc-700 text-white'
                        }`}
                      >
                        Havola
                      </button>
                    )}
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
                    placeholder="Mavzu yoki sarlavha..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Yuboruvchi ismi</label>
                  <input
                    type="text"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="Ismingiz..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Dynamic Sub-inputs based on Selected Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Content Input (Required for Text, Link Description, etc) */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Batafsil matn / Tavsif</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Qayd mazmunini yozing..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>

                {/* Type specific inputs */}
                <div className="space-y-4">
                  {type === 'image' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Rasm URL manzili</label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  )}

                  {type === 'datetime' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Belgilangan vaqt / Deadline</label>
                      <input
                        type="datetime-local"
                        required
                        value={targetTime}
                        onChange={(e) => setTargetTime(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  )}

                  {/* Preset Colors selector */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-2">Kartaning Rangi</label>
                    <div className="flex gap-2">
                      {['#f59e0b', '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#ffffff'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            color === c ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="neon-btn bg-white hover:bg-zinc-200 text-black py-2 px-5 text-sm font-semibold rounded-lg flex items-center gap-2"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'} <Plus size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Cards Section */}
          <div className="col-span-12 mt-4">
            <h3 className="text-lg font-bold text-white mb-6">Saqlangan Qaydlar</h3>
            
            {errorState && (
              <div className="mb-6 p-4 bg-rose-900/30 border border-rose-500/50 rounded-xl text-rose-200 text-xs">
                <strong>Xatolik (Database):</strong> {errorState}
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-10 text-gray-500">Yuklanmoqda...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-gray-500">
                Hozircha qaydlar mavjud emas. Yuqoridagi formadan qo'shing.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`bento-card card-highlight relative flex flex-col justify-between p-6 min-h-[220px] transition-all duration-300 ${
                      item.is_completed ? 'opacity-50' : ''
                    }`}
                    style={{ '--card-accent': item.color } as React.CSSProperties}
                  >
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="icon-badge" style={{ '--badge-color': item.color, '--badge-bg': `${item.color}15` } as React.CSSProperties}>
                        {renderIcon(item.icon, item.color)}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        {item.type === 'todo' && (
                          <button
                            onClick={() => handleToggleComplete(item.id, item.is_completed)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              item.is_completed 
                                ? 'bg-emerald-500 border-emerald-500 text-black' 
                                : 'border-zinc-700 hover:border-emerald-500 text-gray-400 hover:text-emerald-400'
                            }`}
                            title={item.is_completed ? "Bajarilmadi deb belgilash" : "Bajarildi deb belgilash"}
                          >
                            <Check size={14} />
                          </button>
                        )}
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
                    <div className="flex-grow">
                      <h4 className={`text-base font-bold text-white mb-2 ${item.is_completed ? 'line-through text-gray-500' : ''}`}>
                        {item.title}
                      </h4>
                      
                      {item.content && (
                        <p className={`text-xs text-gray-400 mb-4 leading-relaxed ${item.is_completed ? 'line-through text-gray-600' : ''}`}>
                          {item.content}
                        </p>
                      )}

                      {/* Image Preview */}
                      {item.type === 'image' && item.image_url && (
                        <div className="w-full h-32 rounded-lg overflow-hidden border border-zinc-800 mb-4">
                          <img 
                            src={item.image_url} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      )}

                      {/* Time display */}
                      {item.type === 'datetime' && item.target_time && (
                        <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 w-fit" style={{ color: item.color }}>
                          <Clock size={12} />
                          {new Date(item.target_time).toLocaleString('uz-UZ', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
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
          </div>

        </div>

      </main>
    </div>
  );
}
