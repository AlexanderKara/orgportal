import React from 'react';
import { SortAsc, SortDesc } from 'lucide-react';
import Select from 'react-select';

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    minHeight: 40,
    borderColor: state.isFocused ? '#FF8A15' : '#D9D9D9',
    boxShadow: state.isFocused ? '0 0 0 2px #FF8A15' : 'none',
    outline: 'none',
    '&:hover': {
      borderColor: '#FF8A15',
    },
    paddingRight: 0,
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: 8,
    zIndex: 20,
    minWidth: 'fit-content',
    width: 'auto',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#FF8A15' : state.isFocused ? '#FFE5CC' : '#fff',
    color: state.isSelected ? '#fff' : '#2D2D2D',
    borderRadius: 6,
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: '#BDBDBD',
    paddingRight: 8,
    paddingLeft: 4,
  }),
};

const SortControl = ({ 
  sortBy, 
  sortDirection, 
  sortOptions, 
  onSortChange, 
  onDirectionChange,
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Сортировка:</span>
      <Select
        value={{ value: sortBy, label: sortOptions.find(opt => opt.value === sortBy)?.label }}
        onChange={(option) => onSortChange(option.value)}
        options={sortOptions}
        styles={customSelectStyles}
        className="w-32"
      />
      <button
        onClick={onDirectionChange}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        title={sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
      >
        {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default SortControl; 