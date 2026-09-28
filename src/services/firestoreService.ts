import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  writeBatch,
  getDoc,
  collection,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProductItem, Customer, CustomerOrder } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const STORAGE_KEY_SYNC = 'sublistock_last_firestore_sync_v1';
const STORAGE_KEY_AUTOSYNC = 'sublistock_autosync_enabled_v1';

export interface FirestoreSyncInfo {
  lastSyncAt: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  counts: {
    products: number;
    customers: number;
    orders: number;
  };
  autoSyncEnabled: boolean;
  errorMessage?: string;
}

const DEFAULT_SYNC_INFO: FirestoreSyncInfo = {
  lastSyncAt: null,
  status: 'idle',
  counts: {
    products: 0,
    customers: 0,
    orders: 0
  },
  autoSyncEnabled: true
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
   * Synchronizes products, customers and orders collections to Firebase Firestore.
   * Uses batched writes (up to 500 ops per batch) for high performance and atomicity.
   */
  static async syncAllCollectionsToFirestore(
    products: ProductItem[],
    customers: Customer[],
    orders: CustomerOrder[]
  ): Promise<{
    success: boolean;
    syncedAt: string;
    counts: { products: number; customers: number; orders: number };
    error?: string;
  }> {
    const nowIso = new Date().toISOString();

    this.saveSyncInfo({
      status: 'syncing',
      errorMessage: undefined
    });

    try {
      // 1. Sync Products in batches
      await this.batchSyncCollection('products', products);

      // 2. Sync Customers in batches
      await this.batchSyncCollection('customers', customers);

      // 3. Sync Customer Orders in batches
      await this.batchSyncCollection('orders', orders);

      // 4. Save metadata sync status document in Firestore
      const metaDocRef = doc(db, 'metadata', 'sync_status');
      await setDoc(
        metaDocRef,
        {
          lastSyncAt: nowIso,
          updatedAt: serverTimestamp(),
          counts: {
            products: products.length,
            customers: customers.length,
            orders: orders.length
          },
          appVersion: '1.0.0',
          syncedBy: 'SubliStock Pro Web Client'
        },
        { merge: true }
      );

      const resultCounts = {
        products: products.length,
        customers: customers.length,
        orders: orders.length
      };

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
      const errMsg = error?.message || 'Error desconocido al sincronizar con Firestore';

      this.saveSyncInfo({
        status: 'error',
        errorMessage: errMsg
      });

      return {
        success: false,
        syncedAt: nowIso,
        counts: { products: 0, customers: 0, orders: 0 },
        error: errMsg
      };
    }
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
        // Clean out undefined fields for Firestore compatibility
        const cleanItem = JSON.parse(JSON.stringify(item));
        batch.set(docRef, cleanItem, { merge: true });
      }

      await batch.commit();
    }
  }
}
