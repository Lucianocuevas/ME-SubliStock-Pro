import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  Smartphone,
  Download,
  CloudUpload,
  CheckCircle,
  Copy,
  Code,
  FileCode,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Flame,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { MySQLGeneratorService } from '../../services/mysqlGeneratorService';
import { FirestoreService, FirestoreSyncInfo } from '../../services/firestoreService';
import { ProductItem, Supplier, Customer, CustomerOrder, DailySale, AppUser } from '../../types';
import firebaseConfig from '../../../firebase-applet-config.json';

interface Props {
  products: ProductItem[];
  suppliers: Supplier[];
  customers: Customer[];
  orders: CustomerOrder[];
  dailySales: DailySale[];
  users: AppUser[];
}

export const BackendCloudView: React.FC<Props> = ({
  products,
  suppliers,
  customers,
  orders,
  dailySales,
  users
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'mysql' | 'springboot' | 'mobile'>('cloud');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [syncInfo, setSyncInfo] = useState<FirestoreSyncInfo>(FirestoreService.getSyncInfo());

  // Listen to Firestore synchronization events and trigger auto-sync if appropriate
  useEffect(() => {
    const handleSyncUpdate = (e: any) => {
      if (e.detail) {
        setSyncInfo(e.detail);
      } else {
        setSyncInfo(FirestoreService.getSyncInfo());
      }
    };

    window.addEventListener('sublistock_firestore_sync_updated', handleSyncUpdate);

    // Initial auto-sync if enabled and hasn't synced yet
    const current = FirestoreService.getSyncInfo();
    if (current.autoSyncEnabled && !current.lastSyncAt && products.length > 0) {
      FirestoreService.syncAllCollectionsToFirestore(products, customers, orders);
    }

    return () => {
      window.removeEventListener('sublistock_firestore_sync_updated', handleSyncUpdate);
    };
  }, [products, customers, orders]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleForceFirestoreSync = async () => {
    await FirestoreService.syncAllCollectionsToFirestore(products, customers, orders);
  };

  const handleToggleAutoSync = () => {
    const nextVal = !syncInfo.autoSyncEnabled;
    FirestoreService.setAutoSyncEnabled(nextVal);
    if (nextVal) {
      FirestoreService.syncAllCollectionsToFirestore(products, customers, orders);
    }
  };

  const handleDownloadMySQL = () => {
    const sql = MySQLGeneratorService.generateFullMySQLScript(
      products,
      suppliers,
      customers,
      orders,
      dailySales,
      users
    );
    const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sublistock_mysql_schema_dump_${new Date().toISOString().split('T')[0]}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSONBackup = () => {
    const jsonStr = StorageService.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sublistock_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSyncDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca sincronizado';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' hs';
    } catch {
      return dateStr;
    }
  };

  const springBootStructure = MySQLGeneratorService.getSpringBootStructure();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Sincronización en la Nube & Arquitectura Backend</h2>
            <span className="text-xs bg-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded border border-orange-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3" />
              Firebase Firestore & Spring Boot
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automatiza el respaldo de productos, clientes y órdenes hacia Firebase Firestore y descarga la base relacional MySQL para la futura app móvil.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleForceFirestoreSync}
            disabled={syncInfo.status === 'syncing'}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-950/60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncInfo.status === 'syncing' ? 'animate-spin' : ''}`} />
            <span>{syncInfo.status === 'syncing' ? 'Sincronizando...' : 'Forzar Respaldo Firestore'}</span>
          </button>

          <button
            onClick={handleDownloadMySQL}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar .SQL</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('cloud')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'cloud'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CloudUpload className="w-4 h-4" />
          <span>Sincronización Firestore</span>
        </button>

        <button
          onClick={() => setActiveTab('mysql')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'mysql'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Esquema MySQL DDL</span>
        </button>

        <button
          onClick={() => setActiveTab('springboot')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'springboot'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Java Spring Boot 3</span>
        </button>

        <button
          onClick={() => setActiveTab('mobile')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'mobile'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Endpoints API Móvil</span>
        </button>
      </div>

      {/* Tab: Cloud (Firestore Sync Card & Status) */}
      {activeTab === 'cloud' && (
        <div className="space-y-5">
          {/* Main Firestore Sync Hero Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                  <Flame className="w-6 h-6 fill-orange-500/20" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Sincronización Automática con Firebase Firestore</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Conectado a la Nube
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Transfiere y mantiene respaldadas en tiempo real las colecciones <code className="text-orange-300 font-mono text-[11px]">products</code>, <code className="text-orange-300 font-mono text-[11px]">customers</code> y <code className="text-orange-300 font-mono text-[11px]">orders</code>.
                  </p>
                </div>
              </div>

              {/* Action: Force Backup Button */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleForceFirestoreSync}
                  disabled={syncInfo.status === 'syncing'}
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-950/60 transition-all active:scale-95 disabled:opacity-50"
                  title="Ejecuta una sincronización inmediata de todas las colecciones"
                >
                  <RefreshCw className={`w-4 h-4 ${syncInfo.status === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>{syncInfo.status === 'syncing' ? 'Sincronizando Datos...' : 'Forzar Respaldo Ahora'}</span>
                </button>
              </div>
            </div>

            {/* Status & Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Metric 1: Estado de Sincronización */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Estado de Conexión
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  {syncInfo.status === 'syncing' && (
                    <>
                      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-sm font-bold text-amber-300">Sincronizando...</span>
                    </>
                  )}
                  {syncInfo.status === 'success' && (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">Sincronizado</span>
                    </>
                  )}
                  {syncInfo.status === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-bold text-rose-400">Error de Sync</span>
                    </>
                  )}
                  {syncInfo.status === 'idle' && (
                    <>
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-300">Pendiente</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block truncate">
                  Base: {firebaseConfig.firestoreDatabaseId || 'default'}
                </span>
              </div>

              {/* Metric 2: Última Sincronización */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
                  <span>Última Sincronización</span>
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                </span>
                <div className="text-sm font-bold text-white font-mono truncate pt-0.5">
                  {formatSyncDate(syncInfo.lastSyncAt)}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {syncInfo.lastSyncAt ? 'Respaldado en Firestore' : 'Presiona "Forzar Respaldo"'}
                </span>
              </div>

              {/* Metric 3: Documentos en la Nube */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Registros en la Nube
                </span>
                <div className="text-sm font-bold text-orange-400 font-mono pt-0.5">
                  {products.length + customers.length + orders.length} documentos
                </div>
                <span className="text-[11px] text-slate-500 block truncate">
                  {products.length} prod • {customers.length} cli • {orders.length} ord
                </span>
              </div>

              {/* Metric 4: Auto-Sincronización Switch */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Auto-Sincronizar
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncInfo.autoSyncEnabled}
                      onChange={handleToggleAutoSync}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {syncInfo.autoSyncEnabled
                    ? 'Automático al cargar y cambiar datos'
                    : 'Modo manual activo'}
                </p>
              </div>
            </div>

            {/* Error Message banner if any */}
            {syncInfo.errorMessage && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Error en el último respaldo: {syncInfo.errorMessage}</span>
              </div>
            )}

            {/* Firestore Collections Details Cards */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Colecciones Automatizadas en Firestore
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Collection 1: products */}
                <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">/products</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono">
                      {products.length} docs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tazas (cerámica, polímero), remeras (spum, modal, algodón), gorras, vinilos, stock disponible, costos y precios.
                  </p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
                    <span>Sincronización por ID (merge: true)</span>
                    <span className="text-emerald-400">✓ Activo</span>
                  </div>
                </div>

                {/* Collection 2: customers */}
                <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-400">/customers</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono">
                      {customers.length} docs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Cartera de clientes, teléfonos, emails, CUIT/DNI, saldos adeudados y acumulado de pedidos.
                  </p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
                    <span>Sincronización por ID (merge: true)</span>
                    <span className="text-emerald-400">✓ Activo</span>
                  </div>
                </div>

                {/* Collection 3: orders */}
                <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-orange-400">/orders</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono">
                      {orders.length} docs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pedidos con fechas de entrega, estado de producción, pagos, señas y especificación de prendas lisas o con diseño.
                  </p>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
                    <span>Sincronización por ID (merge: true)</span>
                    <span className="text-emerald-400">✓ Activo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Export & Backup Files Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Respaldo Relacional MySQL (.sql)</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Descarga un volcado DDL SQL completo compatible con Google Cloud SQL, AWS RDS o servidores MySQL 8 con todas las tablas e inserts de datos actuales.
              </p>
              <button
                onClick={handleDownloadMySQL}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Descargar Script MySQL (.sql)</span>
              </button>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Copia de Seguridad Integral JSON</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exporta la base completa de la aplicación (incluyendo presupuestos con imágenes en Base64, usuarios y roles) para restaurar en cualquier momento.
              </p>
              <button
                onClick={handleDownloadJSONBackup}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Descargar Backup JSON Completo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: MySQL */}
      {activeTab === 'mysql' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  Script SQL Listo para Cloud SQL, AWS RDS o Servidor MySQL Local
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Incluye creación de tablas con claves foráneas, restricciones de integridad, índices y volcados automáticos (INSERTS) de los datos actuales.
                </p>
              </div>

              <button
                onClick={handleDownloadMySQL}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Descargar .sql</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-500 block">Tablas Creadas</span>
                <span className="text-white font-bold text-sm">8 Tablas Relacionales</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-500 block">Motor</span>
                <span className="text-indigo-400 font-bold text-sm">InnoDB (ACID)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-500 block">Charset</span>
                <span className="text-white font-bold text-sm">utf8mb4_unicode_ci</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-500 block">Registros a Importar</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {products.length + orders.length + customers.length + users.length} registros
                </span>
              </div>
            </div>

            <div className="relative mt-4">
              <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-lg border-x border-t border-slate-800 text-xs text-slate-400">
                <span className="font-mono">sublistock_schema_and_seed.sql</span>
                <button
                  onClick={() => handleCopy(MySQLGeneratorService.generateFullMySQLScript(products, suppliers, customers, orders, dailySales, users).substring(0, 1500), 'sql')}
                  className="hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedKey === 'sql' ? '¡Copiado!' : 'Copiar fragmento'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-b-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
{`-- ========================================================
-- BASE DE DATOS: sublistock_db
-- MOTOR: MySQL 8.0+ / Cloud SQL / AWS RDS
-- ========================================================

CREATE DATABASE IF NOT EXISTS \`sublistock_db\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`sublistock_db\`;

-- 1. TABLA: suppliers (Proveedores de Insumos)
CREATE TABLE IF NOT EXISTS \`suppliers\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`contact_person\` VARCHAR(120),
  \`phone\` VARCHAR(50),
  \`email\` VARCHAR(120),
  \`tax_id\` VARCHAR(50),
  \`address\` VARCHAR(255),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABLA: products (Insumos y Prendas Lisas / Con Diseño)
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`sku\` VARCHAR(60) UNIQUE NOT NULL,
  \`name\` VARCHAR(200) NOT NULL,
  \`category\` ENUM('tazas', 'textil', 'gorras', 'platos', 'llaveros', 'vinilos', 'papel_tinta', 'otros') NOT NULL,
  \`material\` VARCHAR(60) NOT NULL,
  \`size\` VARCHAR(50),
  \`color\` VARCHAR(50),
  \`current_stock\` INT NOT NULL DEFAULT 0,
  \`min_stock\` INT NOT NULL DEFAULT 10,
  \`cost_price\` DECIMAL(12,2) NOT NULL,
  \`sale_price\` DECIMAL(12,2) NOT NULL,
  \`supplier_id\` VARCHAR(64),
  FOREIGN KEY (\`supplier_id\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. TABLA: customer_orders (Pedidos a Producción)
CREATE TABLE IF NOT EXISTS \`customer_orders\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`order_number\` VARCHAR(50) UNIQUE NOT NULL,
  \`customer_id\` VARCHAR(64) NOT NULL,
  \`delivery_date\` DATE NOT NULL,
  \`delivery_time\` VARCHAR(10) DEFAULT '17:00',
  \`production_status\` ENUM('diseno_pendiente','en_produccion','control_calidad','listo_entrega','entregado','cancelado') NOT NULL,
  \`total_amount\` DECIMAL(12,2) NOT NULL,
  \`deposit_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0,
  \`google_calendar_event_id\` VARCHAR(255)
) ENGINE=InnoDB;

-- 4. TABLA: customer_order_items (Detalle con imagen y modo lisa/con diseño)
CREATE TABLE IF NOT EXISTS \`customer_order_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_id\` VARCHAR(64) NOT NULL,
  \`product_id\` VARCHAR(64) NOT NULL,
  \`sale_mode\` ENUM('con_diseno', 'lisa') NOT NULL DEFAULT 'con_diseno',
  \`quantity\` INT NOT NULL,
  \`unit_price\` DECIMAL(12,2) NOT NULL,
  \`design_image_url\` LONGTEXT,
  \`design_notes\` TEXT,
  FOREIGN KEY (\`order_id\`) REFERENCES \`customer_orders\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Spring Boot */}
      {activeTab === 'springboot' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Estructura del Proyecto Java Spring Boot 3.3.x (Maven)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Microservicio REST compilado con Java 21, Spring Data JPA, Spring Security (JWT) y soporte nativo para base de datos MySQL en la nube.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* pom.xml */}
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono font-bold text-indigo-400">pom.xml</span>
                  <button
                    onClick={() => handleCopy(springBootStructure['pom.xml'], 'pom')}
                    className="hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'pom' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto max-h-64 leading-tight bg-slate-900/60 p-2.5 rounded">
                  {springBootStructure['pom.xml']}
                </pre>
              </div>

              {/* application.properties */}
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-mono font-bold text-amber-400">application.properties</span>
                  <button
                    onClick={() => handleCopy(springBootStructure['application.properties'], 'appprops')}
                    className="hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'appprops' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto max-h-64 leading-tight bg-slate-900/60 p-2.5 rounded">
                  {springBootStructure['application.properties']}
                </pre>
              </div>
            </div>

            {/* REST Controller */}
            <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono font-bold text-emerald-400">ProductController.java & OrderController.java</span>
                <button
                  onClick={() => handleCopy(springBootStructure['ProductController.java'], 'controller')}
                  className="hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'controller' ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono text-slate-400 overflow-x-auto max-h-64 leading-tight bg-slate-900/60 p-2.5 rounded">
                {springBootStructure['ProductController.java']}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Mobile Endpoints */}
      {activeTab === 'mobile' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Endpoints REST API para la Futura App Móvil (Flutter / React Native / Kotlin)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                La app móvil podrá consultar stock en vivo en el taller, escanear códigos de barras, crear pedidos con fotos de la cámara y registrar ventas.
              </p>
            </div>

            <div className="space-y-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800">
                    GET
                  </span>
                  <span className="font-mono text-slate-200">/api/v1/products</span>
                  <span className="text-slate-500">Listado de insumos con filtro por rubro, stock y alertas</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">200 OK</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    POST
                  </span>
                  <span className="font-mono text-slate-200">/api/v1/orders</span>
                  <span className="text-slate-500">Crear pedido con subida de imagen de diseño y agendamiento</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">201 CREATED</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
                    PUT
                  </span>
                  <span className="font-mono text-slate-200">/api/v1/orders/:id/status</span>
                  <span className="text-slate-500">Avanzar pedido a "En Plancha / Sublimado" desde el celular</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">200 OK</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800">
                    GET
                  </span>
                  <span className="font-mono text-slate-200">/api/v1/inventory/critical-alerts</span>
                  <span className="text-slate-500">Notificaciones push para alertar stock crítico al encargado</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">200 OK</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-purple-950 text-purple-400 border border-purple-800">
                    POST
                  </span>
                  <span className="font-mono text-slate-200">/api/v1/quotations/:id/convert-to-order</span>
                  <span className="text-slate-500">Aprobar presupuesto desde el celular con el cliente</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">200 OK</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
