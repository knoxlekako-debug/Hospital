import React from 'react';
import { Doctor } from '../src/Types';

interface DoctorsSectionProps {
  doctors: Doctor[];
}

const DoctorsSection: React.FC<DoctorsSectionProps> = ({ doctors }) => {
  return (
    <section id="doctores" className="min-h-[60vh] py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-scale">
          <span className="text-cyan-400 font-bold tracking-widest text-sm uppercase">Equipo Profesional</span>
          <h2 className="text-4xl font-black text-white mt-2">
            Nuestros Especialistas
          </h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mt-4 rounded-full shadow-lg shadow-cyan-400/30"></div>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center text-white/50 py-10 bg-white/10 backdrop-blur-xl rounded-xl">
            <p>Información de doctores no disponible actualmente.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {doctors.map((doc, index) => (
              <div
                key={doc.id}
                className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/20 overflow-hidden group hover:-translate-y-2 transition-all duration-500 hover:shadow-cyan-500/20 animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="h-72 overflow-hidden bg-white/5 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {doc.imageUrl ? (
                    <img
                      src={doc.imageUrl}
                      alt={doc.name}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                      <span className="text-6xl font-black opacity-40">{doc.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="bg-white/20 backdrop-blur-md text-white text-xs px-2 py-1 rounded border border-white/30">
                      Ver Perfil
                    </span>
                  </div>
                </div>
                <div className="p-6 relative">
                  <div className="absolute -top-5 right-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-cyan-500/40">
                    {doc.specialty}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 mt-2">{doc.name}</h3>
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{doc.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default DoctorsSection;
