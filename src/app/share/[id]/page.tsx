import React from 'react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { FileText, Image as ImageIcon, Link as LinkIcon, User, Clock, ExternalLink, Calendar } from 'lucide-react';

interface SharedItem {
  id: string;
  type: 'text' | 'image' | 'link';
  title: string;
  content: string | null;
  image_url: string | null;
  sender: string;
  created_at: string;
}

const TYPE_CONFIG = {
  text: { label: 'Matn', Icon: FileText, color: '#f59e0b' },
  image: { label: 'Rasm', Icon: ImageIcon, color: '#a855f7' },
  link: { label: 'Havola', Icon: LinkIcon, color: '#f43f5e' },
};

export default async function ShareViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  let data = null;
  let error = null;

  if (uuidRegex.test(id)) {
    const res = await supabase.from('shared_items').select('*').eq('id', id).single();
    data = res.data;
    error = res.error;
  } else {
    // Try querying by short_id
    const res = await supabase.from('shared_items').select('*').eq('short_id', id).single();
    if (res.error && res.error.message.includes('short_id')) {
      // Column doesn't exist yet
      error = res.error;
    } else {
      data = res.data;
      error = res.error;
    }
  }

  if (error || !data) {
    notFound();
  }

  const item = data as SharedItem;
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.Icon;

  const formattedDate = new Date(item.created_at).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-circle circle-1"></div>
        <div className="floating-circle circle-2"></div>
        <div className="floating-circle circle-3"></div>
      </div>

      <main className="w-full max-w-lg">

        {/* Brand */}
        <div className="text-center mb-8">
          <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
            Qaytnoma
          </a>
          <p className="text-[10px] text-gray-600 mt-1">Ulashilgan kontent</p>
        </div>

        {/* Main Card */}
        <div
          className="bento-card p-6 fade-in"
          style={{ '--card-accent': cfg.color } as React.CSSProperties}
        >
          {/* Type Badge + Title */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cfg.color}20` }}
              >
                <Icon size={20} style={{ color: cfg.color }} />
              </div>
              <div>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <h1 className="text-lg font-extrabold text-white leading-tight">
                  {item.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Content by Type */}
          <div className="mb-6">
            {item.type === 'text' && item.content && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            )}

            {item.type === 'image' && item.image_url && (
              <div className="w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full object-cover max-h-96"
                />
              </div>
            )}

            {item.type === 'link' && item.content && (
              <a
                href={item.content.startsWith('http') ? item.content : `https://${item.content}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border transition-all group"
                style={{
                  backgroundColor: `${cfg.color}10`,
                  borderColor: `${cfg.color}30`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cfg.color}20` }}
                >
                  <ExternalLink size={16} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold truncate group-hover:underline"
                    style={{ color: cfg.color }}
                  >
                    {item.content}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Ochish uchun bosing</p>
                </div>
                <ExternalLink size={14} className="text-gray-500 flex-shrink-0" />
              </a>
            )}
          </div>

          {/* Sender + Time Info */}
          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cfg.color}20` }}
              >
                <User size={12} style={{ color: cfg.color }} />
              </div>
              <span className="font-semibold text-white">{item.sender}</span>
              <span className="text-gray-600">tomonidan ulashildi</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                <Clock size={12} className="text-gray-500" />
              </div>
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a
            href="/share"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-600 px-4 py-2 rounded-xl"
          >
            Siz ham ulashish yarating
          </a>
        </div>

      </main>
    </div>
  );
}
