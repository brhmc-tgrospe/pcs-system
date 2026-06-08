import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Item, Category } from '../types';
import { items as initialItems, categories as initialCategories } from '../data';

interface CatalogContextType {
  items: Item[];
  categories: Category[];
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (id: string | number, updatedItem: Partial<Item>) => void;
  deleteItem: (id: string | number) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string | number, updatedCategory: Partial<Category>) => void;
  deleteCategory: (id: string | number) => void;
}


const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const addItem = (item: Omit<Item, 'id'>) => {
    const nextId = Math.max(0, ...items.map(i => i.id)) + 1;
    const newItem: Item = { ...item, id: nextId };
    setItems(prev => [newItem, ...prev]);
  };

  const updateItem = (id: string | number, updatedData: Partial<Item>) => {
    const itemId = Number(id);
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updatedData } : item));
  };

  const deleteItem = (id: string | number) => {
    const itemId = Number(id);
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const nextId = Math.max(0, ...categories.map(c => c.id)) + 1;
    const newCategory: Category = { ...category, id: nextId };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string | number, updatedData: Partial<Category>) => {
    const catId = Number(id);
    setCategories(prev => prev.map(cat => cat.id === catId ? { ...cat, ...updatedData } : cat));
  };

  const deleteCategory = (id: string | number) => {
    const catId = Number(id);
    setCategories(prev => prev.filter(cat => cat.id !== catId));
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
