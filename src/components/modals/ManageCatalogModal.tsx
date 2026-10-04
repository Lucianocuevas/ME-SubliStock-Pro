import React, { useState, useEffect } from 'react';
import { X, Tags, Plus, Trash2, Layers, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { CategoryDefinition, MaterialDefinition, ProductItem } from '../../types';
import { StorageService } from '../../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCatalogChanged?: () => void;
}

export const ManageCatalogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCatalogChanged
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'materials'>('categories');
  const [categories, setCategories] = useState<CategoryDefinition[]>([]);
  const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Form states
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newMatLabel, setNewMatLabel] = useState('');
  const [newMatDesc, setNewMatDesc] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    setCategories(StorageService.getCategories());
    setMaterials(StorageService.getMaterials());
    setProducts(StorageService.getProducts());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setNewCatLabel('');
      setNewCatDesc('');
      setNewMatLabel('');
      setNewMatDesc('');
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatLabel.trim();
    if (!trimmed) return;
    try {
      StorageService.addCustomCategory(trimmed, newCatDesc);
      setNewCatLabel('');
      setNewCatDesc('');
      loadData();
      showSuccess(`¡Rubro "${trimmed}" agregado con éxito!`);
      if (onCatalogChanged) onCatalogChanged();
    } catch (err: any) {
      alert(err.message || 'Error al agregar rubro');
    }
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMatLabel.trim();
    if (!trimmed) return;
    try {
      StorageService.addCustomMaterial(trimmed, newMatDesc);
      setNewMatLabel('');
      setNewMatDesc('');
      loadData();
      showSuccess(`¡Material "${trimmed}" agregado con éxito!`);
      if (onCatalogChanged) onCatalogChanged();
    } catch (err: any) {
      alert(err.message || 'Error al agregar material');
    }
  };

  const handleDeleteCategory = (cat: CategoryDefinition) => {
    const productsUsing = products.filter(p => p.category === cat.id);
    if (productsUsing.length > 0) {
      const confirmDelete = confirm(
        `Hay ${productsUsing.length} producto(s) asignados al rubro "${cat.label}". ¿Deseas eliminar este rubro de todos modos?`
      );
      if (!confirmDelete) return;
    } else {
      if (!confirm(`¿Eliminar el rubro "${cat.label}"?`)) return;
    }

    StorageService.deleteCustomCategory(cat.id);
    loadData();
    showSuccess(`Rubro "${cat.label}" eliminado.`);
    if (onCatalogChanged) onCatalogChanged();
  };

  const handleDeleteMaterial = (mat: MaterialDefinition) => {
    const productsUsing = products.filter(p => p.material === mat.id);
    if (productsUsing.length > 0) {
      const confirmDelete = confirm(
        `Hay ${productsUsing.length} producto(s) asignados al material "${mat.label}". ¿Deseas eliminar este material de todos modos?`
      );
      if (!confirmDelete) return;
    } else {
      if (!confirm(`¿Eliminar el tipo de material "${mat.label}"?`)) return;
    }

    StorageService.deleteCustomMaterial(mat.id);
    loadData();
    showSuccess(`Material "${mat.label}" eliminado.`);
    if (onCatalogChanged) onCatalogChanged();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Gestión de Rubros y Materiales de Insumos</span>
              </h2>
              <p className="text-xs text-slate-400">
                Agrega rubros y tipos de materiales personalizados para catalogar tu taller de sublimación
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab selector */}
        <div className="px-6 pt-4 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'categories'
                ? 'border-orange-500 text-orange-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tags className="w-4 h-4" />
            <span>Rubros / Categorías ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'materials'
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tipos de Materiales ({materials.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Form to add category */}
              <form onSubmit={handleAddCategory} className="bg-slate-950/60 border border-orange-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Plus className="w-4 h-4" />
                  <span>Agregar Nuevo Rubro</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <label className="block text-[11px] text-slate-300 mb-1">Nombre del Rubro *</label>
                    <input
                      type="text"
                      value={newCatLabel}
                      onChange={e => setNewCatLabel(e.target.value)}
                      placeholder="Ej: Termos y Botellas, Cuadros..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[11px] text-slate-300 mb-1">Descripción / Detalles (Opcional)</label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      placeholder="Ej: Botellas térmicas, mates, chops"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* List of categories */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Rubros Registrados en el Sistema ({categories.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {categories.map(cat => {
                    const count = products.filter(p => p.category === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{cat.label}</span>
                            {cat.isCustom ? (
                              <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] rounded border border-orange-500/30">
                                Personalizado
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">
                                Estándar
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{cat.description}</p>
                          )}
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-500" />
                            <span>{count} {count === 1 ? 'producto asignado' : 'productos asignados'}</span>
                          </div>
                        </div>

                        {cat.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                            title="Eliminar este rubro personalizado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATERIALS */}
          {activeTab === 'materials' && (
            <div className="space-y-6">
              {/* Form to add material */}
              <form onSubmit={handleAddMaterial} className="bg-slate-950/60 border border-cyan-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Plus className="w-4 h-4" />
                  <span>Agregar Nuevo Tipo de Material</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <label className="block text-[11px] text-slate-300 mb-1">Nombre del Material *</label>
                    <input
                      type="text"
                      value={newMatLabel}
                      onChange={e => setNewMatLabel(e.target.value)}
                      placeholder="Ej: Acero Inoxidable, Vidrio Templado..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-[11px] text-slate-300 mb-1">Descripción / Propiedades (Opcional)</label>
                    <input
                      type="text"
                      value={newMatDesc}
                      onChange={e => setNewMatDesc(e.target.value)}
                      placeholder="Ej: Resistente al impacto, térmico"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* List of materials */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Materiales Registrados en el Sistema ({materials.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {materials.map(mat => {
                    const count = products.filter(p => p.material === mat.id).length;
                    return (
                      <div
                        key={mat.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{mat.label}</span>
                            {mat.isCustom ? (
                              <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded border border-cyan-500/30">
                                Personalizado
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">
                                Estándar
                              </span>
                            )}
                          </div>
                          {mat.description && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{mat.description}</p>
                          )}
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-500" />
                            <span>{count} {count === 1 ? 'producto asignado' : 'productos asignados'}</span>
                          </div>
                        </div>

                        {mat.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(mat)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                            title="Eliminar este material personalizado"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
          <span className="text-[11px] text-slate-400">
            Los rubros y materiales agregados están inmediatamente disponibles en inventario, ventas y filtros.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
