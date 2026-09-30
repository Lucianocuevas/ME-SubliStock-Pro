import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  writeBatch,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ProductItem,
  Supplier,
  Customer,
  CustomerOrder,
  PurchaseOrder,
  DailySale,
  Quotation,
  AccountMovement
} from '../types';
import { StorageService, AppSettings } from './storageService';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const STORAGE_KEY_SYNC = 'sublistock_last_firestore_sync_v2';
const STORAGE_KEY_AUTOSYNC = 'sublistock_autosync_enabled_v2';
const DEVICE_ID_KEY = 'sublistock_device_id_v1';

// Generate or retrieve persistent local device ID to avoid echo updates
export function getDeviceId(): string {
  let devId = localStorage.getItem(DEVICE_ID_KEY);
  if (!devId) {
    devId = 'dev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, devId);
  }
  return devId;
}

export interface FirestoreSyncInfo {
  lastSyncAt: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  counts: {
    products: number;
    customers: number;
    suppliers: number;
    orders: number;
    purchases: number;
    dailySales: number;
    quotations: number;
    accountMovements: number;
  };
  autoSyncEnabled: boolean;
  errorMessage?: string;
  databaseId: string;
}

const DEFAULT_SYNC_INFO: FirestoreSyncInfo = {
  lastSyncAt: null,
  status: 'idle',
  counts: {
    products: 0,
    customers: 0,
    suppliers: 0,
    orders: 0,
    purchases: 0,
    dailySales: 0,
    quotations: 0,
    accountMovements: 0
  },
  autoSyncEnabled: true,
  databaseId: firebaseConfig.firestoreDatabaseId || 'default'
};

export class FirestoreService {
  /**
   * Reads persistent synchronization status from local storage
   */
  static getSyncInfo(): FirestoreSyncInfo {
    const raw = localStorage.getItem(STORAGE_KEY_SYNC);
    const autoSyncRaw = localStorage.getItem(STORAGE_KEY_AUTOSYNC);
    const autoSyncEnabled = autoSyncRaw !== null ? autoSyncRaw === 'true' : true;

    if (!raw) {
      return { ...DEFAULT_SYNC_INFO, autoSyncEnabled };
    }
    try {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SYNC_INFO, ...parsed, autoSyncEnabled };
    } catch {
      return { ...DEFAULT_SYNC_INFO, autoSyncEnabled };
    }
  }

  static saveSyncInfo(info: Partial<FirestoreSyncInfo>): void {
    const current = this.getSyncInfo();
    const updated = { ...current, ...info };
    localStorage.setItem(STORAGE_KEY_SYNC, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sublistock_firestore_sync_updated', { detail: updated }));
  }

  static setAutoSyncEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEY_AUTOSYNC, enabled ? 'true' : 'false');
    this.saveSyncInfo({ autoSyncEnabled: enabled });
  }

  /**
   * Test connection to Firestore
   */
  static async testCloudConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const metaRef = doc(db, 'metadata', 'sync_status');
      await getDoc(metaRef);
      return { connected: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      console.error('Firestore connection test error:', err);
      return { connected: false, latencyMs: Date.now() - start, error: err?.message || 'Error de conexión' };
    }
  }

  /**
   * Alias for backwards compatibility with BackendCloudView
   */
  static async syncAllCollectionsToFirestore(
    _products?: ProductItem[],
    _customers?: Customer[],
    _orders?: CustomerOrder[]
  ) {
    return this.uploadAllToCloud();
  }

  /**
   * Upload all local collections to Firebase Firestore (Backup / Push to Cloud)
   */
  static async uploadAllToCloud(): Promise<{
    success: boolean;
    syncedAt: string;
    counts: FirestoreSyncInfo['counts'];
    error?: string;
  }> {
    const nowIso = new Date().toISOString();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const errMsg = 'Dispositivo sin conexión a internet. La aplicación sigue funcionando en modo local offline.';
      this.saveSyncInfo({
        status: 'error',
        errorMessage: errMsg
      });
      return {
        success: false,
        syncedAt: nowIso,
        counts: DEFAULT_SYNC_INFO.counts,
        error: errMsg
      };
    }

    this.saveSyncInfo({
      status: 'syncing',
      errorMessage: undefined
    });

    try {
      const products = StorageService.getProducts();
      const customers = StorageService.getCustomers();
      const suppliers = StorageService.getSuppliers();
      const orders = StorageService.getCustomerOrders();
      const purchases = StorageService.getPurchaseOrders();
      const dailySales = StorageService.getDailySales();
      const quotations = StorageService.getQuotations();
      const accountMovements = StorageService.getAccountMovements();
      const settings = StorageService.getSettings();

      // 1. Batch Sync Collections
      await this.batchSyncCollection('products', products);
      await this.batchSyncCollection('customers', customers);
      await this.batchSyncCollection('suppliers', suppliers);
      await this.batchSyncCollection('orders', orders);
      await this.batchSyncCollection('purchases', purchases);
      await this.batchSyncCollection('daily_sales', dailySales);
      await this.batchSyncCollection('quotations', quotations);
      await this.batchSyncCollection('account_movements', accountMovements);

      // 2. Settings document
      const settingsDocRef = doc(db, 'settings', 'general');
      await setDoc(settingsDocRef, JSON.parse(JSON.stringify(settings)), { merge: true });

      // 3. Metadata sync status
      const metaDocRef = doc(db, 'metadata', 'sync_status');
      await setDoc(
        metaDocRef,
        {
          lastSyncAt: nowIso,
          updatedAt: serverTimestamp(),
          lastUpdatedByDeviceId: getDeviceId(),
          counts: {
            products: products.length,
            customers: customers.length,
            suppliers: suppliers.length,
            orders: orders.length,
            purchases: purchases.length,
            dailySales: dailySales.length,
            quotations: quotations.length,
            accountMovements: accountMovements.length
          },
          appVersion: '2.0.0'
        },
        { merge: true }
      );

      const resultCounts = {
        products: products.length,
        customers: customers.length,
        suppliers: suppliers.length,
        orders: orders.length,
        purchases: purchases.length,
        dailySales: dailySales.length,
        quotations: quotations.length,
        accountMovements: accountMovements.length
      };

      // Reset pending changes counter
      StorageService.resetPendingChanges();

      this.saveSyncInfo({
        status: 'success',
        lastSyncAt: nowIso,
        counts: resultCounts,
        errorMessage: undefined
      });

      return {
        success: true,
        syncedAt: nowIso,
        counts: resultCounts
      };
    } catch (error: any) {
      console.error('Error synchronizing to Firestore:', error);
      const errMsg = error?.message || 'Error al conectar con la base de datos Firestore';

      this.saveSyncInfo({
        status: 'error',
        errorMessage: errMsg
      });

      return {
        success: false,
        syncedAt: nowIso,
        counts: DEFAULT_SYNC_INFO.counts,
        error: errMsg
      };
    }
  }

  /**
   * Pull / Download all collections from Firebase Firestore into the local storage (for mobile devices, new tablets, or other PCs)
   */
  static async downloadAllFromCloud(): Promise<{
    success: boolean;
    counts: FirestoreSyncInfo['counts'];
    error?: string;
  }> {
    this.saveSyncInfo({
      status: 'syncing',
      errorMessage: undefined
    });

    try {
      // 1. Fetch each collection from cloud
      const [
        prodsSnap,
        custsSnap,
        supsSnap,
        ordsSnap,
        pursSnap,
        salesSnap,
        quotesSnap,
        movsSnap,
        settSnap
      ] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'suppliers')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'purchases')),
        getDocs(collection(db, 'daily_sales')),
        getDocs(collection(db, 'quotations')),
        getDocs(collection(db, 'account_movements')),
        getDoc(doc(db, 'settings', 'general'))
      ]);

      const counts = {
        products: prodsSnap.size,
        customers: custsSnap.size,
        suppliers: supsSnap.size,
        orders: ordsSnap.size,
        purchases: pursSnap.size,
        dailySales: salesSnap.size,
        quotations: quotesSnap.size,
        accountMovements: movsSnap.size
      };

      // Only overwrite if cloud collections have data, or if specifically populated
      if (prodsSnap.size > 0) {
        const products = prodsSnap.docs.map(d => ({ ...d.data(), id: d.id } as ProductItem));
        StorageService.saveProducts(products);
      }
      if (custsSnap.size > 0) {
        const customers = custsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
        StorageService.saveCustomers(customers);
      }
      if (supsSnap.size > 0) {
        const suppliers = supsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Supplier));
        StorageService.saveSuppliers(suppliers);
      }
      if (ordsSnap.size > 0) {
        const orders = ordsSnap.docs.map(d => ({ ...d.data(), id: d.id } as CustomerOrder));
        StorageService.saveCustomerOrders(orders);
      }
      if (pursSnap.size > 0) {
        const purchases = pursSnap.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseOrder));
        StorageService.savePurchaseOrders(purchases);
      }
      if (salesSnap.size > 0) {
        const sales = salesSnap.docs.map(d => ({ ...d.data(), id: d.id } as DailySale));
        StorageService.saveDailySales(sales);
      }
      if (quotesSnap.size > 0) {
        const quotes = quotesSnap.docs.map(d => ({ ...d.data(), id: d.id } as Quotation));
        StorageService.saveQuotations(quotes);
      }
      if (movsSnap.size > 0) {
        const movements = movsSnap.docs.map(d => ({ ...d.data(), id: d.id } as AccountMovement));
        StorageService.saveAccountMovements(movements);
      }
      if (settSnap.exists()) {
        const cloudSettings = settSnap.data() as AppSettings;
        StorageService.saveSettings(cloudSettings);
      }

      const nowIso = new Date().toISOString();
      this.saveSyncInfo({
        status: 'success',
        lastSyncAt: nowIso,
        counts,
        errorMessage: undefined
      });

      return {
        success: true,
        counts
      };
    } catch (err: any) {
      console.error('Error downloading from Firestore:', err);
      const errMsg = err?.message || 'Error al descargar datos de Firestore';
      this.saveSyncInfo({
        status: 'error',
        errorMessage: errMsg
      });
      return {
        success: false,
        counts: DEFAULT_SYNC_INFO.counts,
        error: errMsg
      };
    }
  }

  /**
   * Listen to remote changes made by other devices in real time
   */
  static listenToRemoteSync(onRemoteChange: () => void): Unsubscribe {
    const metaRef = doc(db, 'metadata', 'sync_status');
    const myDeviceId = getDeviceId();

    return onSnapshot(
      metaRef,
      snapshot => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        // If change comes from another device, trigger callback
        if (data.lastUpdatedByDeviceId && data.lastUpdatedByDeviceId !== myDeviceId) {
          console.log('Detected remote update from another device, refreshing local data...');
          onRemoteChange();
        }
      },
      error => {
        console.warn('Real-time listener error:', error);
      }
    );
  }

  /**
   * Helper to write documents to a Firestore collection in batches of max 400 documents
   */
  private static async batchSyncCollection<T extends { id: string }>(
    collectionName: string,
    items: T[]
  ): Promise<void> {
    if (items.length === 0) return;

    const batchSize = 400;
    for (let i = 0; i < items.length; i += batchSize) {
      const chunk = items.slice(i, i + batchSize);
      const batch = writeBatch(db);

      for (const item of chunk) {
        const docRef = doc(db, collectionName, item.id);
        const cleanItem = JSON.parse(JSON.stringify(item));
        batch.set(docRef, cleanItem, { merge: true });
      }

      await batch.commit();
    }
  }
}
