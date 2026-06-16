import { useState, useEffect } from 'react';

export interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: 'rose' | 'emerald' | 'blue';
  action: () => void;
}

export function useDataTable<T extends { id: number; deleted_at?: string | null }>(
  items: T[],
  filterFn: (item: T, search: string, status: any) => boolean,
  defaultStatusFilter: string = 'all'
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<any>(defaultStatusFilter);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, perPage]);

  const filteredItems = items.filter(item => filterFn(item, searchTerm, statusFilter));
  const totalPages = Math.ceil(filteredItems.length / perPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(c => c.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const execAction = () => {
    if (modalConfig) {
      modalConfig.action();
    }
  };

  return {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    isModalOpen, setIsModalOpen,
    selectedIds, setSelectedIds,
    modalConfig, setModalConfig,
    currentPage, setCurrentPage,
    perPage, setPerPage,
    filteredItems,
    totalPages,
    paginatedItems,
    toggleSelectAll,
    toggleSelect,
    execAction
  };
}
