import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Save } from 'lucide-react';
import { ProductItem, ProductCategory, MaterialType, Supplier } from '../../types';
import { StorageService } from '../../services/storageService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductItem | null;
  initialSku?: string;
  suppliers: Supplier[];
  onProductSaved: () => void;
}

export const NewProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  productToEdit,
  initialSku,
  suppliers,
  onProductSaved
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('tazas');
  const [material, setMaterial] = useState<MaterialType>('ceramica');
  const [size, setSize] = useState('11oz');
  const [color, setColor] = useState('Blanco');
  const [unit, setUnit] = useState('Unidades');
  const [currentStock, setCurrentStock] = useState<number>(20);
  const [minStock, setMinStock] = useState<number>(25);
  const [costPrice, setCostPrice] = useState<number>(1200);
  const [salePrice, setSalePrice] = useState<number>(3800);
  const [supplierId, setSupplierId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setMaterial(productToEdit.material);
      setSize(productToEdit.size || '');
      setColor(productToEdit.color || '');
      setUnit(productToEdit.unit);
      setCurrentStock(productToEdit.currentStock);
      setMinStock(productToEdit.minStock);
      setCostPrice(productToEdit.costPrice);
      setSalePrice(productToEdit.salePrice);
      setSupplierId(productToEdit.supplierId || '');
      setLocation(productToEdit.location || '');
      setDescription(productToEdit.description || '');
    } else {
      // Default auto SKU or scanned SKU
      setSku(initialSku || `SUB-${Date.now().toString().slice(-4)}`);
      setName('');
      setCategory('tazas');
      setMaterial('ceramica');
      setSize('11oz');
      setColor('Blanco');
      setUnit('Unidades');
      setCurrentStock(20);
      setMinStock(25);
      setCostPrice(1200);
      setSalePrice(3800);
      setSupplierId(suppliers[0]?.id || '');
      setLocation('Estante A-1');
      setDescription('');
    }
  }, [productToEdit, initialSku, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor indica el nombre del producto');
      return;
    }

    if (productToEdit) {
      StorageService.updateProduct({
        ...productToEdit,
        sku: sku.trim() || productToEdit.sku,
        name: name.trim(),
        category,
        material,
        size: size.trim() || undefined,
        color: color.trim() || undefined,
        unit: unit.trim() || 'Unidades',
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        supplierId: supplierId || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined
      });
    } else {
      StorageService.addProduct({
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        category,
        material,
        size: size.trim() || undefined,
        color: color.trim() || undefined,
        unit: unit.trim() || 'Unidades',
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice) || 0,
        supplierId: supplierId || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        lastRestocked: new Date().toISOString().split('T')[0]
      });
    }

    onProductSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {productToEdit ? 'Editar Producto / Insumo' : 'Nuevo Producto / Insumo de Sublimación'}
              </h2>
              <p className="text-xs text-slate-400">Configura rubro, material, talle, stock y niveles de alerta crítica</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Código SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="Ej: TAZ-CER-11"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Nombre del Insumo / Producto
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Taza de Cerámica Blanca AAA o Remera Spum M"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Rubro
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ProductCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Material Principal
              </label>
              <select
                value={material}
                onChange={e => setMaterial(e.target.value as MaterialType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                {Object.entries(MATERIAL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Talle / Tamaño / Capacidad
              </label>
              <input
                type="text"
                value={size}
                onChange={e => setSize(e.target.value)}
                placeholder="Ej: 11oz, S, M, L, XL, 50cm x 10m"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Color
              </label>
              <input
                type="text"
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="Ej: Blanco, Negro, Gris Melange"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Unidad de Medida
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Unidades">Unidades</option>
                <option value="Metros">Metros</option>
                <option value="Rollos">Rollos</option>
                <option value="Paquetes">Paquetes / Resmas</option>
                <option value="Kits">Kits</option>
                <option value="Litros">Litros / ml</option>
              </select>
            </div>
          </div>

          {/* Stock Levels & Critical Alert */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider block">
              Control de Inventario y Niveles de Alerta
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Stock Actual en Taller</label>
                <input
                  type="number"
                  min="0"
                  value={currentStock}
                  onChange={e => setCurrentStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-rose-400 mb-1 font-semibold">
                  Nivel Crítico de Alerta (Stock Mínimo)
                </label>
                <input
                  type="number"
                  min="1"
                  value={minStock}
                  onChange={e => setMinStock(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El sistema disparará alerta visual cuando el stock sea $\le$ este número.
                </span>
              </div>
            </div>
          </div>

          {/* Cost & Sale Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Costo de Compra Unitario ($)
              </label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                Precio de Venta Sugerido ($)
              </label>
              <input
                type="number"
                min="0"
                value={salePrice}
                onChange={e => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Proveedor Habitual
              </label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">-- Sin proveedor asignado --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Ubicación en el Taller
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Ej: Estante A-2, Caja 5"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Descripción o Instrucciones Técnicas
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Temperatura de planchado 185°C por 60 seg, presión media-alta..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
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
              className="px-5 py-2.5 rounded-lg text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-2 shadow-lg shadow-orange-950/50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Guardar Cambios' : 'Registrar Insumo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
