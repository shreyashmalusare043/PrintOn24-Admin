import React, { useState } from 'react';
import { Calendar, Filter, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PrintShop } from '@/types/types';

export type DateFilterPreset = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export interface FilterState {
  datePreset: DateFilterPreset;
  startDate: string;
  endDate: string;
  shopIds: string[]; // multi-shop support
  status: string;
  paymentType: string;
}

interface DatabaseFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  shops?: PrintShop[];
  showShopFilter?: boolean;
  showStatusFilter?: boolean;
  statusOptions?: { label: string; value: string }[];
  showPaymentFilter?: boolean;
  paymentOptions?: { label: string; value: string }[];
  placeholderSearch?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const DatabaseFilterBar: React.FC<DatabaseFilterBarProps> = ({
  filters,
  onFilterChange,
  shops = [],
  showShopFilter = true,
  showStatusFilter = true,
  statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ],
  showPaymentFilter = false,
  paymentOptions = [
    { label: 'All Payment Modes', value: 'all' },
    { label: 'Counter Only', value: 'counter' },
    { label: 'Online / Razorpay Only', value: 'razorpay' },
    { label: 'Both (Cash & Online)', value: 'both' }
  ]
}) => {
  const [showCustomDates, setShowCustomDates] = useState(filters.datePreset === 'custom');

  const handleDatePresetChange = (preset: DateFilterPreset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = '';
    let end = '';

    if (preset === 'today') {
      start = today.toISOString().split('T')[0];
      end = new Date().toISOString().split('T')[0];
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = y.toISOString().split('T')[0];
      end = y.toISOString().split('T')[0];
    } else if (preset === '7days') {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 7);
      start = past7.toISOString().split('T')[0];
      end = new Date().toISOString().split('T')[0];
    } else if (preset === '30days') {
      const past30 = new Date(today);
      past30.setDate(past30.getDate() - 30);
      start = past30.toISOString().split('T')[0];
      end = new Date().toISOString().split('T')[0];
    }

    setShowCustomDates(preset === 'custom');
    onFilterChange({
      ...filters,
      datePreset: preset,
      startDate: preset === 'custom' ? filters.startDate : start,
      endDate: preset === 'custom' ? filters.endDate : end
    });
  };

  const handleToggleShop = (shopId: string) => {
    let nextShopIds = [...filters.shopIds];
    if (shopId === 'all') {
      nextShopIds = [];
    } else if (nextShopIds.includes(shopId)) {
      nextShopIds = nextShopIds.filter((id) => id !== shopId);
    } else {
      nextShopIds.push(shopId);
    }
    onFilterChange({ ...filters, shopIds: nextShopIds });
  };

  const handleReset = () => {
    setShowCustomDates(false);
    onFilterChange({
      datePreset: 'all',
      startDate: '',
      endDate: '',
      shopIds: [],
      status: 'all',
      paymentType: 'all'
    });
  };

  const hasActiveFilters =
    filters.datePreset !== 'all' ||
    filters.shopIds.length > 0 ||
    filters.status !== 'all' ||
    filters.paymentType !== 'all';

  return (
    <div className="bg-card border border-border p-3.5 rounded-xl space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date Range Preset Selector */}
        <div className="flex items-center space-x-1">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          <Select
            value={filters.datePreset}
            onValueChange={(val: DateFilterPreset) => handleDatePresetChange(val)}
          >
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range Inputs */}
        {showCustomDates && (
          <div className="flex items-center gap-1.5 text-xs">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              className="h-8 text-xs w-32"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              className="h-8 text-xs w-32"
            />
          </div>
        )}

        {/* Multi-Shop / Printer Selector */}
        {showShopFilter && shops.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                <span>
                  {filters.shopIds.length === 0
                    ? 'All Shops / Terminals'
                    : `${filters.shopIds.length} Shop${filters.shopIds.length > 1 ? 's' : ''} Selected`}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-2 max-h-64 overflow-y-auto">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleToggleShop('all')}
                  className="w-full flex items-center justify-between p-1.5 text-xs rounded hover:bg-muted text-left font-medium"
                >
                  <span>Select All Shops</span>
                  {filters.shopIds.length === 0 && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
                <div className="h-px bg-border my-1" />
                {shops.map((shop) => {
                  const selected = filters.shopIds.includes(shop.id);
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => handleToggleShop(shop.id)}
                      className="w-full flex items-center justify-between p-1.5 text-xs rounded hover:bg-muted text-left"
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-foreground truncate">{shop.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{shop.terminal_code}</p>
                      </div>
                      {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <Select
            value={filters.status}
            onValueChange={(val) => onFilterChange({ ...filters, status: val })}
          >
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Payment Type Filter */}
        {showPaymentFilter && (
          <Select
            value={filters.paymentType}
            onValueChange={(val) => onFilterChange({ ...filters, paymentType: val })}
          >
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue placeholder="Payment Mode" />
            </SelectTrigger>
            <SelectContent>
              {paymentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
