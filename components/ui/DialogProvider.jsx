"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const DialogContext = createContext();

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) throw new Error("useDialog must be used within DialogProvider");
    return context;
};

export function DialogProvider({ children }) {
    const [dialogs, setDialogs] = useState([]);
    
    const showDialog = useCallback((options) => {
        return new Promise((resolve) => {
            const id = Math.random().toString(36).substr(2, 9);
            setDialogs(prev => [...prev, { ...options, id, resolve }]);
        });
    }, []);

    const showConfirm = useCallback((message, title = "Confirm Action") => {
        return showDialog({ type: 'confirm', message, title });
    }, [showDialog]);

    const showAlert = useCallback((message, title = "Alert") => {
        return showDialog({ type: 'alert', message, title });
    }, [showDialog]);

    const handleClose = (id, result) => {
        setDialogs(prev => {
            const dialog = prev.find(d => d.id === id);
            if (dialog) dialog.resolve(result);
            return prev.filter(d => d.id !== id);
        });
    };

    return (
        <DialogContext.Provider value={{ showConfirm, showAlert }}>
            {children}
            
            {dialogs.length > 0 && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 p-4 font-sans">
                    <style>{`
                        @keyframes dialogZoomIn {
                            from { opacity: 0; transform: scale(0.95) translateY(10px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                        .animate-dialog-in { animation: dialogZoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    `}</style>
                    
                    {dialogs.map((dialog, index) => {
                        const isTop = index === dialogs.length - 1;
                        if (!isTop) return null; 
                        
                        return (
                            <div 
                                key={dialog.id} 
                                className="bg-white rounded-lg shadow-md w-full max-w-md overflow-hidden animate-dialog-in"
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${dialog.type === 'confirm' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {dialog.type === 'confirm' ? <FaExclamationTriangle size={20} /> : <FaInfoCircle size={20} />}
                                        </div>
                                        <div className="flex-1 mt-1">
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">{dialog.title}</h3>
                                            <p className="text-[14px] text-slate-600 leading-relaxed font-medium">{dialog.message}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                                    {dialog.type === 'confirm' && (
                                        <button 
                                            onClick={() => handleClose(dialog.id, false)}
                                            className="px-5 py-2.5 text-[13px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleClose(dialog.id, true)}
                                        className={`px-5 py-2.5 text-[13px] font-bold text-white rounded-xl transition-colors ${dialog.type === 'confirm' ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_4px_12px_rgba(244,63,94,0.3)]' : 'bg-blue-600 hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.3)]'}`}
                                    >
                                        {dialog.type === 'confirm' ? 'Confirm' : 'OK'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </DialogContext.Provider>
    );
}
