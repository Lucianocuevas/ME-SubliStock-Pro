import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
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
import { ImageCompressionService } from './imageCompressionService';

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

      // 2. Settings document (Safe optimization to never exceed Firestore 1,048,576 bytes limit)
      const settingsToUpload: AppSettings = { ...settings };
      if (settingsToUpload.logoUrl && settingsToUpload.logoUrl.startsWith('data:image')) {
        try {
          // Compress logo to a crisp 380px web image (typically 25 KB - 60 KB)
          const optimizedLogo = await ImageCompressionService.compressImageBase64(
            settingsToUpload.logoUrl,
            380,
            0.82
          );
          if (optimizedLogo.length < settingsToUpload.logoUrl.length) {
            settingsToUpload.logoUrl = optimizedLogo;
            // Also update local storage with the compressed version to free browser memory
            StorageService.saveSettings(settingsToUpload);
          }
        } catch (e) {
          console.warn('Could not compress logoUrl before Firestore sync:', e);
        }
      }

      // Hard check: Ensure the entire settings document is well below 800 KB
      const serializedSettings = JSON.stringify(settingsToUpload);
      if (serializedSettings.length > 800_000 && settingsToUpload.logoUrl) {
        try {
          settingsToUpload.logoUrl = await ImageCompressionService.compressImageBase64(
            settingsToUpload.logoUrl,
            240,
            0.7
          );
          StorageService.saveSettings(settingsToUpload);
        } catch {}
      }

      const settingsDocRef = doc(db, 'settings', 'general');
      await setDoc(settingsDocRef, JSON.parse(JSON.stringify(settingsToUpload)), { merge: true });

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

      // Populate local storage directly with the exact data loaded from the cloud.
      // If a collection in the cloud is empty (0 docs), local storage is set to empty [] (zero fictitious records).
      const products = prodsSnap.docs.map(d => ({ ...d.data(), id: d.id } as ProductItem));
      StorageService.saveProducts(products);

      const customers = custsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Customer));
      StorageService.saveCustomers(customers);

      const suppliers = supsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Supplier));
      StorageService.saveSuppliers(suppliers);

      const orders = ordsSnap.docs.map(d => ({ ...d.data(), id: d.id } as CustomerOrder));
      StorageService.saveCustomerOrders(orders);

      const purchases = pursSnap.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseOrder));
      StorageService.savePurchaseOrders(purchases);

      const sales = salesSnap.docs.map(d => ({ ...d.data(), id: d.id } as DailySale));
      StorageService.saveDailySales(sales);

      const quotes = quotesSnap.docs.map(d => ({ ...d.data(), id: d.id } as Quotation));
      StorageService.saveQuotations(quotes);

      const movements = movsSnap.docs.map(d => ({ ...d.data(), id: d.id } as AccountMovement));
      StorageService.saveAccountMovements(movements);

      if (settSnap.exists()) {
        const cloudSettings = settSnap.data() as AppSettings;
        StorageService.saveSettings(cloudSettings);
      }

      // Reset pending local changes count since local database now matches cloud 100%
      StorageService.resetPendingChanges();

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
   * Delete an individual document directly from a cloud collection
   */
  static async deleteDocFromCloud(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn(`Could not delete doc ${id} from cloud collection ${collectionName}:`, e);
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
   * Synchronize a local collection to Firestore in batches, including deleting documents removed locally
   */
  private static async batchSyncCollection<T extends { id: string }>(
    collectionName: string,
    items: T[]
  ): Promise<void> {
    try {
      const existingSnap = await getDocs(collection(db, collectionName));
      const localMap = new Map(items.map(item => [item.id, item]));

      // Queue of operations: { type: 'set' | 'delete', ref: any, data?: any }
      const ops: Array<{ type: 'set' | 'delete'; ref: any; data?: any }> = [];

      // 1. Delete remote docs that no longer exist locally
      for (const remoteDoc of existingSnap.docs) {
        if (!localMap.has(remoteDoc.id)) {
          ops.push({ type: 'delete', ref: remoteDoc.ref });
        }
      }

      // 2. Insert or update local docs
      for (const item of items) {
        const docRef = doc(db, collectionName, item.id);
        let cleanItem = JSON.parse(JSON.stringify(item));
        if (JSON.stringify(cleanItem).length > 700_000) {
          cleanItem = await ImageCompressionService.sanitizeObjectImages(cleanItem, 400);
        }
        ops.push({ type: 'set', ref: docRef, data: cleanItem });
      }

      if (ops.length === 0) return;

      const batchSize = 400;
      for (let i = 0; i < ops.length; i += batchSize) {
        const chunk = ops.slice(i, i + batchSize);
        const batch = writeBatch(db);
        for (const op of chunk) {
          if (op.type === 'delete') {
            batch.delete(op.ref);
          } else {
            batch.set(op.ref, op.data, { merge: true });
          }
        }
        await batch.commit();
      }
    } catch (e) {
      console.error(`Error in batchSyncCollection for ${collectionName}:`, e);
      throw e;
    }
  }
}
