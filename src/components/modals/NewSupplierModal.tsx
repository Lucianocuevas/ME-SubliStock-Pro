import React, { useState, useEffect } from 'react';
import { X, Truck, Save } from 'lucide-react';
import { Supplier, ProductCategory } from '../../types';
import { StorageService } from '../../services/storageService';
import { CATEGORY_LABELS } from '../../data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
  onSaved: () => void;
}

export const NewSupplierModal: React.FC<Props> = ({ isOpen, onClose, supplierToEdit, onSaved }) => {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [cuitRut, setCuitRut] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(3);
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>(['tazas']);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setContactPerson(supplierToEdit.contactPerson);
      setPhone(supplierToEdit.phone);
      setEmail(supplierToEdit.email);
      setAddress(supplierToEdit.address || '');
      setCuitRut(supplierToEdit.cuitRut || '');
      setLeadTimeDays(supplierToEdit.leadTimeDays || 3);
      setSelectedCategories(supplierToEdit.suppliedCategories || []);
      setNotes(supplierToEdit.notes || '');
    } else {
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCuitRut('');
      setLeadTimeDays(3);
      setSelectedCategories(['tazas']);
      setNotes('');
    }
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (cat: ProductCategory) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Ingresa el nombre del proveedor');
      return;
    }

    if (supplierToEdit) {
      StorageService.updateSupplier({
        ...supplierToEdit,
        name: name.trim(),
        contactPerson: contactPerson.trim() || 'Ventas',
        phone: phone.trim() || 'Sin teléfono',
        email: email.trim() || 'ventas@proveedor.com',
        address: address.trim() || undefined,
        cuitRut: cuitRut.trim() || undefined,
        leadTimeDays: Number(leadTimeDays) || 3,
        suppliedCategories: selectedCategories,
        notes: notes.trim() || undefined
      });
    } else {
      StorageService.addSupplier({
        name: name.trim(),
        contactPerson: contactPerson.trim() || 'Ventas',
        phone: phone.trim() || 'Sin teléfono',
        email: email.trim() || 'ventas@proveedor.com',
        address: address.trim() || undefined,
        cuitRut: cuitRut.trim() || undefined,
        leadTimeDays: Number(leadTimeDays) || 3,
        suppliedCategories: selectedCategories,
        rating: 5,
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
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {supplierToEdit ? 'Editar Proveedor' : 'Registrar Proveedor de Insumos'}
              </h2>
              <p className="text-xs text-slate-400">Directorio de insumos de sublimación</p>
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
              placeholder="Ej: Distribuidora Textil del Sur"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Contacto / Asesor de Ventas
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                placeholder="Ej: Martín Rodríguez"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                CUIT / Identificador Fiscal
              </label>
              <input
                type="text"
                value={cuitRut}
                onChange={e => setCuitRut(e.target.value)}
                placeholder="Ej: 30-71234567-9"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Teléfono / WhatsApp de Pedidos
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 11 4455-8899"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email de Cotizaciones
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="pedidos@proveedor.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Dirección / Depósito
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Depósito Central, CABA"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Demora de Entrega
              </label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={e => setLeadTimeDays(parseInt(e.target.value) || 1)}
                placeholder="Días"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Rubros de Insumos que Provee
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(CATEGORY_LABELS).map(([catKey, val]) => {
                const isSelected = selectedCategories.includes(catKey as ProductCategory);
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => toggleCategory(catKey as ProductCategory)}
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {val.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Condiciones Comerciales y Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Descuentos por cantidad, flete bonificado a partir de $..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Proveedor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
