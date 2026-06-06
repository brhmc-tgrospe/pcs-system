import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Item, Category } from '../types';
import { items as initialItems, categories as initialCategories } from '../data';

interface CatalogContextType {
  items: Item[];
  categories: Category[];
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (id: string, updatedItem: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updatedCategory: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const addItem = (item: Omit<Item, 'id'>) => {
    const newItem: Item = { ...item, id: `item-${Date.now()}` };
    setItems(prev => [newItem, ...prev]);
  };

  const updateItem = (id: string, updatedData: Partial<Item>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = { ...category, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updatedData: Partial<Category>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updatedData } : cat));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Also archive or remove items linked to this category? (Optional for now)
  };

  return (
    <CatalogContext.Provider value={{
      items, categories, addItem, updateItem, deleteItem, addCategory, updateCategory, deleteCategory
    }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
