import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Menu, LogOut, Search, Users, User, Settings as SettingsIcon, Package, Tags, Loader2 } from 'lucide-react';
import { AuthUser, UserSummary, Item, Category } from '../types';
import ImpersonateModal from './ImpersonateModal';

interface HeaderProps {
  onOpenMobile: () => void;
  user: AuthUser;
  users?: UserSummary[];
}

export default function Header({ onOpenMobile, user, users }: HeaderProps) {
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ items: Item[]; categories: Category[]; users: UserSummary[] } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(() => {
      fetch(`/catalog/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data);
          setIsSearching(false);
        })
        .catch(err => {
          console.error('Search error:', err);
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = () => {
    router.post('/logout');
  };

  const handleSearchSelect = (type: 'item' | 'category' | 'user', id: number) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    
    if (type === 'item') {
      router.get('/catalog', { view_item: id });
    } else if (type === 'category') {
      router.get('/catalog');
    } else if (type === 'user') {
      router.get('/users');
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobile}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center relative" ref={searchRef}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Quick search portal..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) setShowSearchDropdown(true);
              }}
              className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:text-slate-200 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all focus:w-80"
            />
            
            {/* Search Dropdown */}
            {showSearchDropdown && (searchQuery.trim().length >= 2) && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                {isSearching ? (
                  <div className="p-4 flex items-center justify-center text-slate-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                  </div>
                ) : searchResults ? (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.items.length === 0 && searchResults.categories.length === 0 && searchResults.users.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">No results found for "{searchQuery}"</div>
                    )}
                    
                    {searchResults.items.length > 0 && (
                      <div className="py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Items</div>
                        {searchResults.items.map(item => (
                          <button key={`item-${item.id}`} onClick={() => handleSearchSelect('item', item.id)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <Package className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</span>
                            </div>
                            <span className="text-xs text-slate-500 ml-5.5">{item.item_code} &bull; {item.category?.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.categories.length > 0 && (
                      <div className="py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Categories</div>
                        {searchResults.categories.map(cat => (
                          <button key={`cat-${cat.id}`} onClick={() => handleSearchSelect('category', cat.id)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2">
                            <Tags className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.users.length > 0 && (
                      <div className="py-2">
                        <div className="px-4 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Users</div>
                        {searchResults.users.map(u => (
                          <button key={`user-${u.id}`} onClick={() => handleSearchSelect('user', u.id)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-fuchsia-500" />
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{u.first_name} {u.last_name}</span>
                            </div>
                            <span className="text-xs text-slate-500 capitalize">{u.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">

          {user.role === 'developer' && !user.is_impersonating && users && (
            <button
              onClick={() => setShowImpersonateModal(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-900/30 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 border border-fuchsia-200 dark:border-fuchsia-700 rounded-lg transition-colors"
              title="Developer Action: Impersonate User"
            >
              <Users className="w-4 h-4" />
              Impersonate
            </button>
          )}

          <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700 sm:border-none sm:pl-0 relative group cursor-pointer">
            <div className="hidden sm:block text-right pr-2">
              <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.full_name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold border-2 border-white dark:border-slate-800 shadow-sm">
              {user.first_name[0]}{user.last_name[0]}
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 sm:hidden">
                <div className="text-sm font-bold text-slate-900 dark:text-white">{user.full_name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</div>
              </div>
              <button
                onClick={() => router.get('/profile')}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" /> My Profile
              </button>
              <button
                onClick={() => router.get('/settings')}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
              >
                <SettingsIcon className="w-4 h-4" /> Settings
              </button>
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {showImpersonateModal && users && (
        <ImpersonateModal
          users={users}
          onClose={() => setShowImpersonateModal(false)}
        />
      )}
    </>
  );
}
