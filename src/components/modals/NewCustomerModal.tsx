import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { Customer } from '../../types';
import { StorageService } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSaved: () => void;
}

export const NewCustomerModal: React.FC<Props> = ({ isOpen, onClose, customerToEdit, onSaved }) => {
  const [name, setName] = useState('');
  const [businessOrContact, setBusinessOrContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setBusinessOrContact(customerToEdit.businessOrContact || '');
      setPhone(customerToEdit.phone);
      setEmail(customerToEdit.email);
      setAddress(customerToEdit.address || '');
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setBusinessOrContact('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }

    if (customerToEdit) {
      StorageService.updateCustomer({
        ...customerToEdit,
        name: name.trim(),
        businessOrContact: businessOrContact.trim() || undefined,
        phone: phone.trim() || 'Sin teléfono',
        email: email.trim() || 'sin_email@taller.com',
        address: address.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      StorageService.addCustomer({
        name: name.trim(),
        businessOrContact: businessOrContact.trim() || undefined,
        phone: phone.trim() || 'Sin teléfono',
        email: email.trim() || 'sin_email@taller.com',
        address: address.trim() || undefined,
        currentBalance: 0,
        notes: notes.trim() || undefined
      });
    }

    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {customerToEdit ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <p className="text-xs text-slate-400">Cartera de clientes del taller de sublimación</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nombre o Razón Social
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Colegio San Martín / Juan Carlos"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Persona de Contacto o Cargo
            </label>
            <input
              type="text"
              value={businessOrContact}
              onChange={e => setBusinessOrContact(e.target.value)}
              placeholder="Ej: Directora María / Prof. de Educación Física"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej: +54 9 11 4455-6677"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Dirección de Entrega
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Calle, Número, Localidad"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Notas del Cliente
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Preferencias de color, horarios de retiro, historial..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
