import React, { useState } from 'react';
import * as api from '../src/Api';
import { supabase } from '../src/supabaseClient';
import { IconSettings } from './Icons';

interface LoginModalProps {
    onClose: () => void;
    onLoginSuccess: () => void;
    activeCenterId?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLoginSuccess, activeCenterId }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isRegister) {
                if (!activeCenterId) throw new Error('Error interno: No se detectó centro activo');

                const { user } = await api.signUp(email, password);
                if (user) {
                    // Usar RPC segura para registrar admin
                    const { error: rpcError } = await supabase.rpc('register_admin_secure', {
                        target_center_id: activeCenterId,
                        secret_code: secretCode,
                        p_first_name: firstName,
                        p_last_name: lastName,
                        p_phone: phone
                    });
                    if (rpcError) throw rpcError;

                    alert('Registro exitoso. Ahora eres administrador de este centro.');
                    setIsRegister(false);
                    setFirstName(''); setLastName(''); setPhone(''); setSecretCode('');
                }
            } else {
                await api.signIn(email, password);
                onLoginSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>

                <div className="text-center mb-6">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconSettings className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">Acceso Administrativo</h2>
                    <div className="flex justify-center gap-4 mt-4 text-sm font-bold">
                        <button onClick={() => setIsRegister(false)} className={`pb-1 border-b-2 ${!isRegister ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>LOGIN</button>
                        <button onClick={() => setIsRegister(true)} className={`pb-1 border-b-2 ${isRegister ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}>REGISTRO</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                            placeholder="admin@cdi.gob.ve"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {isRegister && (
                        <div className="animate-fade-in space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-orange-500 mb-1 uppercase tracking-wider">Código de Seguridad</label>
                                <input
                                    type="text"
                                    value={secretCode}
                                    onChange={e => setSecretCode(e.target.value)}
                                    className="w-full bg-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-slate-700"
                                    placeholder="Código provisto por sistema central"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nombre</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={e => setFirstName(e.target.value)}
                                    className="w-full bg-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                    placeholder="Primer nombre"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Apellido</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={e => setLastName(e.target.value)}
                                    className="w-full bg-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                    placeholder="Apellido completo"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Teléfono</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full bg-white/50 border border-white/30 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                                    placeholder="+58 412 123 4567"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-bold border border-red-100">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/20 mt-4"
                    >
                        {loading ? 'Procesando...' : (isRegister ? 'CREAR CUENTA' : 'INICIAR SESIÓN')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
