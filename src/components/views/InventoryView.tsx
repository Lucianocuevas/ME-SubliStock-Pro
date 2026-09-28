import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Package,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { ProductItem, ProductCategory, MaterialType } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';

interface Props {
  products: ProductItem[];
  onOpenNewProduct: () => void;
  onEditProduct: (product: ProductItem) => void;
  onQuickRestock: (product: ProductItem) => void;
  onRefreshData: () => void;
}

export const InventoryView: React.FC<Props> = ({
  products,
  onOpenNewProduct,
  onEditProduct,
  onQuickRestock,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'normal'>('all');
  const [sortField, setSortField] = useState<'stock' | 'name' | 'category'>('stock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtering logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Text search
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.size && p.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category filter
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      // Material filter
      const matchesMat = selectedMaterial === 'all' || p.material === selectedMaterial;

      // Stock status filter
      let matchesStock = true;
      if (stockFilter === 'critical') {
        matchesStock = p.currentStock <= p.minStock;
      } else if (stockFilter === 'normal') {
        matchesStock = p.currentStock > p.minStock;
      }

      return matchesSearch && matchesCat && matchesMat && matchesStock;
    }).sort((a, b) => {
      if (sortField === 'stock') {
        // Ratio of currentStock to minStock
        const ratioA = a.currentStock / Math.max(1, a.minStock);
        const ratioB = b.currentStock / Math.max(1, b.minStock);
        return sortOrder === 'asc' ? ratioA - ratioB : ratioB - ratioA;
      } else if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc' ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category);
      }
    });
  }, [products, searchTerm, selectedCategory, selectedMaterial, stockFilter, sortField, sortOrder]);

  const handleDelete = (productId: string, productName: string) => {
    if (confirm(`¿Estás seguro de eliminar "${productName}" del inventario?`)) {
      StorageService.deleteProduct(productId);
      onRefreshData();
    }
  };

  const handleExportExcel = () => {
    ExportService.exportStockToExcel(products);
  };

  // Summary Metrics
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalCostValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.currentStock * p.salePrice), 0);
  const criticalProductsCount = products.filter(p => p.currentStock <= p.minStock).length;

  return (
    <div className="space-y-5">
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-400" />
            <span>Control de Stock e Insumos de Sublimación</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de tazas, textiles (algodón, spum, modal), platos, gorras, llaveros y vinilos con alertas automáticas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Exportar inventario actual a Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={onOpenNewProduct}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Metric summary ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Catálogo de Insumos</span>
          <span className="text-xl font-bold text-white">{products.length} productos</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Unidades en Taller</span>
          <span className="text-xl font-bold text-white">{totalUnits} un.</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Valor Total Invertido</span>
          <span className="text-xl font-bold text-white">{formatCurrency(totalCostValue)}</span>
        </div>
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Insumos en Alerta Crítica</span>
          <span className={`text-xl font-bold ${criticalProductsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {criticalProductsCount} ítems
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por SKU, nombre, talle o color..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Todos los Rubros</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Material filter */}
          <div className="md:col-span-3">
            <select
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Todos los Materiales</option>
              {Object.entries(MATERIAL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Stock state filter */}
          <div className="md:col-span-2">
            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">Todo el Stock</option>
              <option value="critical">Solo Críticos / Agotados</option>
              <option value="normal">Solo Con Stock Normal</option>
            </select>
          </div>
        </div>

        {/* Quick rubro buttons (Segmented control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({products.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => {
            const count = products.filter(p => p.category === k).length;
            if (count === 0) return null;
            return (
              <button
                key={k}
                onClick={() => setSelectedCategory(k)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === k
                    ? 'bg-orange-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{v.label}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">SKU / Insumo</th>
                <th className="py-3 px-3">Rubro y Material</th>
                <th className="py-3 px-3">Talle / Color</th>
                <th className="py-3 px-3 text-center">
                  <button
                    onClick={() => {
                      if (sortField === 'stock') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else { setSortField('stock'); setSortOrder('asc'); }
                    }}
                    className="flex items-center gap-1 mx-auto hover:text-white"
                  >
                    <span>Stock Taller</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right">Costo Unit.</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-3 text-center">Estado Alerta</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No se encontraron insumos que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock = product.currentStock === 0;
                  const isCritical = product.currentStock <= product.minStock;
                  const isWarning = product.currentStock <= product.minStock * 1.4;
                  const stockPercent = Math.min(100, Math.round((product.currentStock / Math.max(1, product.minStock * 2)) * 100));

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-slate-950/50 transition-colors ${
                        isOutOfStock ? 'bg-rose-950/20' : (isCritical ? 'bg-amber-950/10' : '')
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] text-slate-400">{product.sku}</div>
                        <div className="font-bold text-white text-sm mt-0.5">{product.name}</div>
                        {product.location && (
                          <span className="text-[10px] text-slate-400">Ubicación: {product.location}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-slate-200 font-medium block">
                          {CATEGORY_LABELS[product.category]?.label || product.category}
                        </span>
                        <span className="text-[11px] text-cyan-400">
                          {MATERIAL_LABELS[product.material] || product.material}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        {product.size && (
                          <div className="text-slate-200 font-medium">Talle: {product.size}</div>
                        )}
                        {product.color && (
                          <div className="text-[11px] text-slate-400">{product.color}</div>
                        )}
                        {!product.size && !product.color && (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-block min-w-28 text-left">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className={`font-black text-sm ${
                              isOutOfStock ? 'text-rose-400' : (isCritical ? 'text-amber-400' : 'text-emerald-400')
                            }`}>
                              {product.currentStock} {product.unit}
                            </span>
                            <span className="text-[10px] text-slate-400">Mín: {product.minStock}</span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOutOfStock ? 'bg-rose-500' : (isCritical ? 'bg-amber-500' : 'bg-emerald-500')
                              }`}
                              style={{ width: `${Math.max(5, stockPercent)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-medium text-slate-300">
                        {formatCurrency(product.costPrice)}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-white text-sm">
                          {formatCurrency(product.salePrice)}
                        </span>
                        <span className="block text-[10px] text-emerald-400">
                          +{Math.round(((product.salePrice - product.costPrice) / Math.max(1, product.costPrice)) * 100)}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-700 animate-pulse">
                            ¡AGOTADO!
                          </span>
                        ) : isCritical ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600">
                            CRÍTICO
                          </span>
                        ) : isWarning ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-950/50 text-yellow-400 border border-yellow-800/50">
                            STOCK BAJO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                            ÓPTIMO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onQuickRestock(product)}
                            className="px-2.5 py-1 bg-orange-950/60 hover:bg-orange-600 border border-orange-800/60 hover:border-orange-500 text-orange-200 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all"
                            title="Reponer stock rápido"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reponer</span>
                          </button>

                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                            title="Editar insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
