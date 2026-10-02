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
  ArrowUpDown,
  BellOff,
  Bell,
  Tag,
  ScanLine,
  Camera,
  QrCode,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { ProductItem, ProductCategory, MaterialType } from '../../types';
import { StorageService, formatCurrency } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import { CATEGORY_LABELS, MATERIAL_LABELS } from '../../data/initialData';
import { BarcodeScannerModal } from '../modals/BarcodeScannerModal';
import { ProductQrModal } from '../modals/ProductQrModal';

interface Props {
  products: ProductItem[];
  onOpenNewProduct: () => void;
  onOpenNewProductWithSku?: (sku: string) => void;
  onEditProduct: (product: ProductItem) => void;
  onQuickRestock: (product: ProductItem) => void;
  onRefreshData: () => void;
  onNavigateToLabels?: () => void;
}

export const InventoryView: React.FC<Props> = ({
  products,
  onOpenNewProduct,
  onOpenNewProductWithSku,
  onEditProduct,
  onQuickRestock,
  onRefreshData,
  onNavigateToLabels
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'critical' | 'normal'>('all');
  const [sortField, setSortField] = useState<'stock' | 'name' | 'category'>('stock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [selectedProductForQr, setSelectedProductForQr] = useState<ProductItem | null>(null);

  // Filtering logic
  const dismissedSet = useMemo(() => new Set(StorageService.getSettings().dismissedAlertProductIds || []), [products]);

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

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      const settings = StorageService.getSettings();
      // Export current filtered list or all products
      const listToExport = filteredProducts.length > 0 ? filteredProducts : products;
      ExportService.exportInventoryToPDF(listToExport, settings);
      setExportSuccessMessage(`Reporte PDF generado exitosamente (${listToExport.length} insumos exportados).`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error generando PDF de inventario:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Summary Metrics
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalCostValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.currentStock * p.salePrice), 0);
  const criticalProductsCount = products.filter(p => p.currentStock <= p.minStock).length;

  return (
    <div className="space-y-5">
      {/* Export feedback toast */}
      {exportSuccessMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-600/80 rounded-xl text-xs font-bold text-emerald-200 flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-emerald-900/50"
          >
            ✕
          </button>
        </div>
      )}

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
            onClick={() => setIsBarcodeScannerOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-950/50 transition-all cursor-pointer"
            title="Escanear código de barras con la cámara del dispositivo para consultar y actualizar stock"
          >
            <ScanLine className="w-4 h-4" />
            <span>Escanear Código (Cámara)</span>
          </button>

          {onNavigateToLabels && (
            <button
              onClick={onNavigateToLabels}
              className="px-3.5 py-2 bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-700/50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Configurar formato y diseñar etiquetas A4 para imprimir"
            >
              <Tag className="w-4 h-4 text-pink-400" />
              <span>Etiquetas A4</span>
            </button>
          )}

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Exportar inventario actual a un reporte formal en PDF con membrete y valoración de stock"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>{isExportingPdf ? 'Generando PDF...' : 'Reporte PDF'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-9 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-orange-400 p-1 rounded transition-colors"
              title="Escanear código de barras con la cámara"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
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
                  const isAlertDismissed = dismissedSet.has(product.id);
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
                        {isAlertDismissed && (isOutOfStock || isCritical || isWarning) ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 inline-flex items-center gap-1">
                              <BellOff className="w-3 h-3 text-amber-400" />
                              Silenciada
                            </span>
                            <span className="block text-[9px] text-slate-500 font-mono">
                              {isOutOfStock ? 'Stock 0' : `Stock ${product.currentStock}`}
                            </span>
                          </div>
                        ) : isOutOfStock ? (
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
                          {/* Toggle silence / restore alert button */}
                          {(isOutOfStock || isCritical || isWarning) && (
                            isAlertDismissed ? (
                              <button
                                onClick={() => {
                                  StorageService.restoreStockAlert(product.id);
                                  onRefreshData();
                                }}
                                className="p-1 text-cyan-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                                title="Reactivar alerta de este insumo"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  StorageService.dismissStockAlert(product.id);
                                  onRefreshData();
                                }}
                                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                                title="Sacar / Silenciar alerta de este insumo"
                              >
                                <BellOff className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}

                          <button
                            onClick={() => onQuickRestock(product)}
                            className="px-2.5 py-1 bg-orange-950/60 hover:bg-orange-600 border border-orange-800/60 hover:border-orange-500 text-orange-200 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all"
                            title="Reponer stock rápido"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reponer</span>
                          </button>

                          <button
                            onClick={() => setSelectedProductForQr(product)}
                            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                            title="Ver Código QR & Código de Barras de este insumo"
                          >
                            <QrCode className="w-3.5 h-3.5" />
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

      {/* Barcode Scanner with Camera Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        products={products}
        onProductUpdated={onRefreshData}
        onSelectProductInInventory={(p) => setSearchTerm(p.sku)}
        onCreateNewProductWithSku={(sku) => {
          if (onOpenNewProductWithSku) {
            onOpenNewProductWithSku(sku);
          } else {
            onOpenNewProduct();
          }
        }}
      />

      {/* Product QR & Barcode Detail Modal */}
      <ProductQrModal
        isOpen={!!selectedProductForQr}
        onClose={() => setSelectedProductForQr(null)}
        product={selectedProductForQr}
        onPrintLabel={onNavigateToLabels ? () => onNavigateToLabels() : undefined}
      />
    </div>
  );
};
