import React from 'react';
import { X } from 'lucide-react';
import FilterSidebar from './FilterSidebar';

const MobileFilterModal = ({ isOpen, onClose, filters, activeFilters, onFilterChange, onClearFilters }) => {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-slate-800">Filter Products</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="overflow-y-auto">
          <FilterSidebar
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            className="shadow-none border-0 rounded-none"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileFilterModal;