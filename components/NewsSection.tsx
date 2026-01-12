import React, { useState, useEffect } from 'react';
import { NewsItem } from '../src/Types';
import { IconClock } from './Icons';
import { formatTimeRemaining } from '../src/Utils';

interface NewsSectionProps {
  news: NewsItem[];
  onExpired: (id: string) => void;
}

const NewsSection: React.FC<NewsSectionProps> = ({ news, onExpired }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    news.forEach(item => {
      if (item.expiresAt < now) {
        onExpired(item.id);
      }
    });
  }, [now, news, onExpired]);

  const activeNews = news.filter(n => n.expiresAt > now);

  return (
    <section id="noticias" className="min-h-[50vh] pb-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-8 gap-4">
          <div className="h-10 w-2 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-400/30"></div>
          <h2 className="text-3xl font-bold text-white">
            Últimas Actualizaciones
          </h2>
        </div>

        {activeNews.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center text-white/60 shadow-lg">
            <p className="text-xl font-medium">No hay boletines activos en este momento.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeNews.map((item, index) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 flex flex-col hover:transform hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 overflow-hidden"
              >
                {/* Media Section */}
                {item.mediaUrl && (
                  <div className="w-full h-48 bg-slate-100 overflow-hidden relative group">
                    {item.mediaType === 'video' ? (
                      <video
                        src={item.mediaUrl}
                        controls
                        className="w-full h-full object-cover"
                        playsInline
                      >
                        Tu navegador no soporta el elemento de video.
                      </video>
                    ) : (
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white leading-tight">{item.title}</h3>
                  </div>

                  <div className="mb-4">
                    <div className="inline-flex items-center text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full animate-pulse">
                      <IconClock className="w-3.5 h-3.5 mr-1.5" />
                      <span>Expira en: {formatTimeRemaining(item.expiresAt)}</span>
                    </div>
                  </div>

                  <p className="text-white/70 flex-grow whitespace-pre-wrap text-sm leading-relaxed mb-4">{item.content}</p>

                  <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">
                      CDI Baraure Info
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsSection;
