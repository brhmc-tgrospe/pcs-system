import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import Dashboard from '../Components/Dashboard';
import MasterCatalog from '../Components/MasterCatalog';
import ManageItems from '../Components/ManageItems';
import ManageCategories from '../Components/ManageCategories';
import PrintReport from '../Components/PrintReport';
import ItemSlideOver from '../Components/ItemSlideOver';
import ImpersonationBanner from '../Components/ImpersonationBanner';
import Toast from '../Components/Toast';
import { CatalogAppProps, Item, Category } from '../types';

type View = 'dashboard' | 'catalog' | 'manage_items' | 'manage_categories' | 'print_report';

export default function CatalogApp() {
  const { items, categories, recentLogs, users, auth } = usePage<CatalogAppProps & Record<string, unknown>>().props;
  const user = auth.user;

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [viewingItem, setViewingItem] = useState<Item | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewItemStr = params.get('view_item');
    if (viewItemStr) {
      const viewItemId = Number(viewItemStr);
      const itemToView = items.find(i => i.id === viewItemId);
      if (itemToView) {
        setViewingItem(itemToView);
        setCurrentView('catalog');
        
        // Remove param from URL without reloading
        window.history.replaceState({}, '', '/catalog');
      }
    }
  }, [items]);

  const navigate = (view: string) => {
    setCurrentView(view as View);
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Toast />
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Impersonation Banner */}
      {user.is_impersonating && <ImpersonationBanner user={user} />}

      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        user={user}
        currentView={currentView}
        onNavigate={navigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenMobile={() => setIsMobileOpen(true)}
          user={user}
          users={users}
        />

        <main className={`flex-1 overflow-y-auto relative ${user.is_impersonating ? 'mt-10' : ''}`}>
          {currentView === 'dashboard' && (
            <Dashboard
              items={items}
              categories={categories}
              recentLogs={recentLogs}
              onNavigate={navigate}
              user={user}
            />
          )}
          {currentView === 'catalog' && (
            <MasterCatalog
              items={items}
              categories={categories}
              onViewItem={setViewingItem}
              onNavigate={navigate}
            />
          )}
          {currentView === 'manage_items' && (
            <ManageItems
              items={items}
              categories={categories}
              onViewItem={setViewingItem}
              user={user}
            />
          )}
          {currentView === 'manage_categories' && (
            <ManageCategories categories={categories} user={user} />
          )}
          {currentView === 'print_report' && (
            <PrintReport
              items={items}
              categories={categories}
              onBack={() => navigate('catalog')}
            />
          )}
        </main>
      </div>

      {/* Global Item SlideOver */}
      <ItemSlideOver
        item={viewingItem}
        category={categories.find((c: Category) => c.id === viewingItem?.category_id)}
        onClose={() => setViewingItem(null)}
      />
    </div>
  );
}
