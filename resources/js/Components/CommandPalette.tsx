import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
  Search,
  Layers,
  LayoutDashboard,
  Package,
  Tags,
  Building2,
  Printer,
  Activity,
  Users,
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  UserCheck,
  LogOut,
  X,
  Loader2,
  ChevronRight,
  Command,
  CornerDownLeft,
  LucideIcon
} from 'lucide-react';
import { AuthUser, SearchResults, Item, Category, Bidder, UserSummary } from '../types';
import { useDarkMode } from './DarkModeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  onOpenImpersonate?: () => void;
}

interface PaletteActionItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: LucideIcon;
  iconColor?: string;
  category: 'Navigation' | 'Actions' | 'Items' | 'Categories' | 'Bidders' | 'Users';
  onSelect: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  user,
  onOpenImpersonate,
}: CommandPaletteProps) {
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdminOrDev = user.role === 'administrator' || user.role === 'developer';
  const isDev = user.role === 'developer';

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setSearchResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`/catalog/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data: SearchResults) => {
          setSearchResults(data);
          setIsSearching(false);
        })
        .catch((err) => {
          console.error('Command palette search error:', err);
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Close helper
  const handleSelectAndClose = useCallback((action: () => void) => {
    onClose();
    action();
  }, [onClose]);

  // Build static navigation items
  const staticNavigation = useMemo<PaletteActionItem[]>(() => {
    const nav: PaletteActionItem[] = [
      {
        id: 'nav-catalog',
        title: 'Master Projects',
        subtitle: 'Browse all project items, specs, and vendor pricing',
        icon: Layers,
        iconColor: 'text-blue-500',
        category: 'Navigation',
        onSelect: () => router.visit('/catalog?view=catalog'),
      },
      {
        id: 'nav-dashboard',
        title: 'Dashboard Overview',
        subtitle: 'Key procurement metrics and quick summary statistics',
        icon: LayoutDashboard,
        iconColor: 'text-indigo-500',
        category: 'Navigation',
        onSelect: () => router.visit('/catalog?view=dashboard'),
      },
    ];

    if (isAdminOrDev) {
      nav.push(
        {
          id: 'nav-manage-items',
          title: 'Manage Items',
          subtitle: 'Create, edit, import, and organize inventory items',
          icon: Package,
          iconColor: 'text-emerald-500',
          category: 'Navigation',
          onSelect: () => router.visit('/catalog?view=manage_items'),
        },
        {
          id: 'nav-manage-categories',
          title: 'Manage Categories',
          subtitle: 'Add, update, or remove item classifications',
          icon: Tags,
          iconColor: 'text-amber-500',
          category: 'Navigation',
          onSelect: () => router.visit('/catalog?view=manage_categories'),
        },
        {
          id: 'nav-bidders',
          title: 'Bidders Directory',
          subtitle: 'Registered vendors, bidders, and supplier profiles',
          icon: Building2,
          iconColor: 'text-cyan-500',
          category: 'Navigation',
          onSelect: () => router.visit('/catalog/bidders'),
        }
      );
    }

    nav.push({
      id: 'nav-print-report',
      title: 'Print Project Report',
      subtitle: 'Generate and print official project pricing documents',
      icon: Printer,
      iconColor: 'text-violet-500',
      category: 'Navigation',
      onSelect: () => router.visit('/catalog?view=print_report'),
    });

    if (isAdminOrDev) {
      nav.push(
        {
          id: 'nav-activity-logs',
          title: 'Activity Logs',
          subtitle: 'Audit trail and system event history',
          icon: Activity,
          iconColor: 'text-rose-500',
          category: 'Navigation',
          onSelect: () => router.visit('/activity-logs'),
        },
        {
          id: 'nav-users',
          title: 'User Management',
          subtitle: 'Manage user accounts, roles, and access credentials',
          icon: Users,
          iconColor: 'text-fuchsia-500',
          category: 'Navigation',
          onSelect: () => router.visit('/users'),
        }
      );
    }

    nav.push(
      {
        id: 'nav-settings',
        title: 'System Settings',
        subtitle: 'Configure application preferences and signatories',
        icon: SettingsIcon,
        iconColor: 'text-slate-500',
        category: 'Navigation',
        onSelect: () => router.visit('/settings'),
      },
      {
        id: 'nav-profile',
        title: 'My Profile',
        subtitle: 'Update your personal details and change password',
        icon: User,
        iconColor: 'text-sky-500',
        category: 'Navigation',
        onSelect: () => router.visit('/profile'),
      }
    );

    return nav;
  }, [isAdminOrDev]);

  // Build static system actions
  const staticActions = useMemo<PaletteActionItem[]>(() => {
    const actions: PaletteActionItem[] = [
      {
        id: 'action-toggle-theme',
        title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: isDark ? 'Enable clean light interface' : 'Enable eye-friendly dark interface',
        icon: isDark ? Sun : Moon,
        iconColor: isDark ? 'text-amber-400' : 'text-indigo-400',
        category: 'Actions',
        onSelect: () => toggleDarkMode(),
      },
    ];

    if (isDev && !user.is_impersonating && onOpenImpersonate) {
      actions.push({
        id: 'action-impersonate',
        title: 'Impersonate User',
        subtitle: 'Developer tool to preview portal as another user role',
        icon: UserCheck,
        iconColor: 'text-fuchsia-500',
        category: 'Actions',
        onSelect: () => onOpenImpersonate(),
      });
    }

    actions.push({
      id: 'action-logout',
      title: 'Sign Out',
      subtitle: 'Securely end your current portal session',
      icon: LogOut,
      iconColor: 'text-rose-500',
      category: 'Actions',
      onSelect: () => router.post('/logout'),
    });

    return actions;
  }, [isDark, isDev, user.is_impersonating, onOpenImpersonate, toggleDarkMode]);

  // Filter static items by search query
  const filteredNavigation = useMemo(() => {
    if (!query.trim()) return staticNavigation;
    const q = query.toLowerCase();
    return staticNavigation.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q)
    );
  }, [staticNavigation, query]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return staticActions;
    const q = query.toLowerCase();
    return staticActions.filter(
      (item) => item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q)
    );
  }, [staticActions, query]);

  // Map dynamic search results to palette items
  const dynamicItems = useMemo<PaletteActionItem[]>(() => {
    if (!searchResults) return [];

    const items: PaletteActionItem[] = [];

    // Items
    searchResults.items?.forEach((item: Item) => {
      items.push({
        id: `item-${item.id}`,
        title: item.name,
        subtitle: `${item.item_code} • ${item.category?.name || 'Uncategorized'} • ₱${Number(item.unit_cost || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
        badge: 'Item',
        icon: Package,
        iconColor: 'text-blue-500',
        category: 'Items',
        onSelect: () => router.visit(`/catalog?view_item=${item.id}`),
      });
    });

    // Categories
    searchResults.categories?.forEach((cat: Category) => {
      items.push({
        id: `cat-${cat.id}`,
        title: cat.name,
        subtitle: cat.cat_code ? `Code: ${cat.cat_code}` : 'Item Category',
        badge: 'Category',
        icon: Tags,
        iconColor: 'text-emerald-500',
        category: 'Categories',
        onSelect: () => router.visit(`/catalog?category=${cat.id}`),
      });
    });

    // Bidders
    searchResults.bidders?.forEach((bidder: Bidder) => {
      items.push({
        id: `bidder-${bidder.id}`,
        title: bidder.name,
        subtitle: bidder.contact_person || bidder.contact_number ? `${bidder.contact_person || ''} ${bidder.contact_number ? `(${bidder.contact_number})` : ''}` : 'Registered Vendor',
        badge: 'Bidder',
        icon: Building2,
        iconColor: 'text-cyan-500',
        category: 'Bidders',
        onSelect: () => router.visit(`/catalog/bidders?search=${encodeURIComponent(bidder.name)}`),
      });
    });

    // Users
    searchResults.users?.forEach((u: UserSummary) => {
      items.push({
        id: `user-${u.id}`,
        title: u.full_name,
        subtitle: `@${u.username} • ${u.email}`,
        badge: u.role,
        icon: Users,
        iconColor: 'text-fuchsia-500',
        category: 'Users',
        onSelect: () => router.visit(`/users?search=${encodeURIComponent(u.username)}`),
      });
    });

    return items;
  }, [searchResults]);

  // Combine into flattened array for linear keyboard traversal
  const allVisibleItems = useMemo<PaletteActionItem[]>(() => {
    return [
      ...dynamicItems,
      ...filteredNavigation,
      ...filteredActions,
    ];
  }, [dynamicItems, filteredNavigation, filteredActions]);

  // Group items by category for rendering headers
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: PaletteActionItem[] } = {};
    allVisibleItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [allVisibleItems]);

  // Reset selected index when item count changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [allVisibleItems.length, query]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (allVisibleItems.length === 0 ? 0 : (prev + 1) % allVisibleItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (allVisibleItems.length === 0 ? 0 : (prev - 1 + allVisibleItems.length) % allVisibleItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allVisibleItems[selectedIndex]) {
        handleSelectAndClose(allVisibleItems[selectedIndex].onSelect);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Auto-scroll selected element into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden z-10 flex flex-col max-h-[85vh] transition-all duration-200 animate-in zoom-in-95"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search items, categories, bidders, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base focus:ring-0 focus:outline-none"
          />

          {isSearching && (
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-2 shrink-0" />
          )}

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors mr-2 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto flex-1 p-2 divide-y divide-slate-100 dark:divide-slate-700/50">
          {allVisibleItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No matching commands or records found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for item names, SKU codes, bidders, or system settings.
              </p>
            </div>
          ) : (
            Object.entries(groupedSections).map(([sectionName, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={sectionName} className="py-2 first:pt-1 last:pb-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {sectionName} ({items.length})
                  </div>

                  <div className="mt-1 space-y-0.5">
                    {items.map((item) => {
                      const itemIndex = allVisibleItems.indexOf(item);
                      const isSelected = itemIndex === selectedIndex;
                      const IconComponent = item.icon;

                      return (
                        <button
                          key={item.id}
                          data-active={isSelected}
                          onClick={() => handleSelectAndClose(item.onSelect)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                isSelected
                                  ? 'bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300'
                                  : 'bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <IconComponent className={`w-4 h-4 ${item.iconColor || ''}`} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 shrink-0 capitalize">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center text-slate-400">
                            {isSelected ? (
                              <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Select <CornerDownLeft className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <ChevronRight className="w-4 h-4 opacity-40" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-[11px] shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-[11px] shadow-2xs">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-[11px] shadow-2xs">
                ↵
              </kbd>{' '}
              Select
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded font-mono text-[11px] shadow-2xs">
                ESC
              </kbd>{' '}
              Close
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <Command className="w-3.5 h-3.5" /> Spotlight Command Center
          </div>
        </div>
      </div>
    </div>
  );
}
