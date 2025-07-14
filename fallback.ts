/**
 * Local storage fallback for development when Firebase isn't configured
 */

import { Item } from './types';

const STORAGE_KEY = 'campus-lost-found-fallback';
let mockData: Item[] = [];
let listeners: ((items: Item[]) => void)[] = [];

/**
 * Load items from localStorage
 */
function loadFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      mockData = parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }));
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    mockData = [];
  }
}

/**
 * Save items to localStorage
 */
function saveToStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Notify all listeners of data changes
 */
function notifyListeners(): void {
  listeners.forEach(callback => callback([...mockData]));
}

/**
 * Fallback onItems implementation using localStorage
 */
export function onItemsFallback(callback: (items: Item[]) => void): () => void {
  loadFromStorage();
  listeners.push(callback);
  
  // Initial call
  setTimeout(() => callback([...mockData]), 0);
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Fallback addItem implementation using localStorage
 */
export async function addItemFallback(data: Omit<Item, 'id' | 'status' | 'createdAt'>): Promise<void> {
  const newItem: Item = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    photo: data.photo,
    status: 'lost',
    createdAt: new Date()
  };
  
  mockData.push(newItem);
  saveToStorage();
  notifyListeners();
}

/**
 * Fallback markFound implementation using localStorage
 */
export async function markFoundFallback(id: string): Promise<void> {
  const item = mockData.find(item => item.id === id);
  if (item) {
    item.status = 'found';
    saveToStorage();
    notifyListeners();
  }
}
