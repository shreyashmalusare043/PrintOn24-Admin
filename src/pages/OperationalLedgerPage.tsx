import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { fetchShops } from '@/services/api';
import type { PrintShop } from '@/types/types';
import {
  Activity,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Store,
  CreditCard,
  Banknote,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export interface LedgerOrderRow {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  shop_id: string;
  shop_name: string | null;
  token_number: string | null;
  document_name: string | null;
  total_pages: number | null;
  config_copies: number | null;
  grand_total: number;
  payment_method: string | null;
  payment_status: string | null;
  order_status: string | null;
  created_at: string;
}

export const OperationalLedgerPage: React.FC = () => {
  const [orders, setOrders] = useState<LedgerOrderRow[]>([]);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // 5 Server-Side Filter States
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const [paymentType, setPaymentType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<'created_at' | 'grand_total' | 'total_pages' | 'order_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Aggregated Summary Across Filtered Query
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    onlineRevenue: 0,
    counterRevenue: 0,
    avgOrderValue: 0
  });

  // Load connected shops for filter dropdown
  useEffect(() => {
    fetchShops(100).then(setShops).catch(console.error);
  }, []);

  // Compute exact Date Boundary from Preset
  const dateRangeBounds = useMemo(() => {
    const now = new Date('2026-10-11T23:59:59Z');
    if (datePreset === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (datePreset === 'yesterday') {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    if (datePreset === '7days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (datePreset === '30days') {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (datePreset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (datePreset === 'custom') {
      const start = customStartDate ? new Date(customStartDate + 'T00:00:00Z').toISOString() : undefined;
      const end = customEndDate ? new Date(customEndDate + 'T23:59:59Z').toISOString() : undefined;
      return { start, end };
    }
    return { start: undefined, end: undefined };
  }, [datePreset, customStartDate, customEndDate]);

  // Main DB Fetch Function with Server-Side Filtering
  const loadLedgerData = async () => {
    setLoading(true);
    try {
      // 1. Build Query for Paginated Records
      let query = supabase
        .from('print_orders')
        .select('*', { count: 'exact' });

      // Apply Shop Filter
      if (selectedShopId && selectedShopId !== 'all') {
        query = query.eq('shop_id', selectedShopId);
      }

      // Apply Payment Type Filter
      if (paymentType === 'online') {
        query = query.or('payment_method.ilike.%online%,payment_method.ilike.%razorpay%,payment_method.ilike.%payu%');
      } else if (paymentType === 'counter') {
        query = query.or('payment_method.ilike.%counter%,payment_method.ilike.%cash%');
      }

      // Apply Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed') {
          query = query.or('payment_status.eq.completed,payment_status.eq.paid,order_status.eq.completed');
        } else if (statusFilter === 'pending') {
          query = query.or('payment_status.eq.pending,order_status.eq.pending,order_status.eq.processing');
        } else if (statusFilter === 'failed') {
          query = query.or('payment_status.eq.failed,order_status.eq.cancelled');
        }
      }

      // Apply Date Bounds
      if (dateRangeBounds.start) {
        query = query.gte('created_at', dateRangeBounds.start);
      }
      if (dateRangeBounds.end) {
        query = query.lte('created_at', dateRangeBounds.end);
      }

      // Apply Search (order_number, customer_name, document_name, token_number)
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        query = query.or(`order_number.ilike.${q},customer_name.ilike.${q},document_name.ilike.${q},token_number.ilike.${q}`);
      }

      // Apply Sorting & Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;

      setOrders(data || []);
      setTotalCount(count || 0);

      // 2. Fetch Aggregates across the entire filtered dataset for Summary Cards
      let aggQuery = supabase
        .from('print_orders')
        .select('grand_total, payment_method, payment_status, order_status');

      if (selectedShopId && selectedShopId !== 'all') {
        aggQuery = aggQuery.eq('shop_id', selectedShopId);
      }
      if (paymentType === 'online') {
        aggQuery = aggQuery.or('payment_method.ilike.%online%,payment_method.ilike.%razorpay%,payment_method.ilike.%payu%');
      } else if (paymentType === 'counter') {
        aggQuery = aggQuery.or('payment_method.ilike.%counter%,payment_method.ilike.%cash%');
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed') {
          aggQuery = aggQuery.or('payment_status.eq.completed,payment_status.eq.paid,order_status.eq.completed');
        } else if (statusFilter === 'pending') {
          aggQuery = aggQuery.or('payment_status.eq.pending,order_status.eq.pending,order_status.eq.processing');
        } else if (statusFilter === 'failed') {
          aggQuery = aggQuery.or('payment_status.eq.failed,order_status.eq.cancelled');
        }
      }
      if (dateRangeBounds.start) aggQuery = aggQuery.gte('created_at', dateRangeBounds.start);
      if (dateRangeBounds.end) aggQuery = aggQuery.lte('created_at', dateRangeBounds.end);
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        aggQuery = aggQuery.or(`order_number.ilike.${q},customer_name.ilike.${q},document_name.ilike.${q},token_number.ilike.${q}`);
      }

      const { data: aggData } = await aggQuery.limit(5000);

      let totRev = 0;
      let onlRev = 0;
      let cntRev = 0;
      const totalRows = (aggData || []).length;

      (aggData || []).forEach((row: any) => {
        const amt = Number(row.grand_total) || 0;
        totRev += amt;
        const method = (row.payment_method || '').toLowerCase();
        if (method.includes('online') || method.includes('razorpay') || method.includes('payu')) {
          onlRev += amt;
        } else {
          cntRev += amt;
        }
      });

      setSummary({
        totalOrders: totalRows,
        totalRevenue: totRev,
        onlineRevenue: onlRev,
        counterRevenue: cntRev,
        avgOrderValue: totalRows > 0 ? Math.round(totRev / totalRows) : 0
      });

    } catch (err: any) {
      console.error('Error querying operational ledger:', err);
      toast.error('Failed to load operational ledger from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, [
    page,
    pageSize,
    sortBy,
    sortOrder,
    dateRangeBounds,
    selectedShopId,
    paymentType,
    statusFilter
  ]);

  // Handle Search on Enter or debounced
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLedgerData();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // Fetch up to 1000 matching rows from DB for clean CSV export
      let expQuery = supabase.from('print_orders').select('*');
      if (selectedShopId && selectedShopId !== 'all') expQuery = expQuery.eq('shop_id', selectedShopId);
      if (dateRangeBounds.start) expQuery = expQuery.gte('created_at', dateRangeBounds.start);
      if (dateRangeBounds.end) expQuery = expQuery.lte('created_at', dateRangeBounds.end);
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        expQuery = expQuery.or(`order_number.ilike.${q},customer_name.ilike.${q},document_name.ilike.${q}`);
      }

      const { data } = await expQuery.order('created_at', { ascending: false }).limit(2000);
      if (!data || data.length === 0) {
        toast.error('No matching records to export');
        return;
      }

      const headers = ['Order Number', 'Date', 'Shop Name', 'Customer Name', 'Phone', 'Document', 'Pages', 'Total (₹)', 'Payment Method', 'Payment Status', 'Order Status'];
      const rows = data.map((d: any) => [
        `"${d.order_number || ''}"`,
        `"${d.created_at || ''}"`,
        `"${d.shop_name || ''}"`,
        `"${d.customer_name || ''}"`,
        `"${d.customer_phone || ''}"`,
        `"${(d.document_name || '').replace(/"/g, '""')}"`,
        d.total_pages || 1,
        d.grand_total || 0,
        `"${d.payment_method || ''}"`,
        `"${d.payment_status || ''}"`,
        `"${d.order_status || ''}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PrintOn24_Operational_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${data.length} ledger transactions to CSV`);
    } catch (err: any) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const toggleSort = (col: 'created_at' | 'grand_total' | 'total_pages' | 'order_number') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Operational Ledger
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              Direct DB Stream
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Complete transaction ledger for print orders across connected print shops with server-side query filters.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLedgerData}
            disabled={loading}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCSV}
            disabled={exporting || totalCount === 0}
            className="h-9 gap-1.5 text-xs shadow-sm"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Filtered CSV'}
          </Button>
        </div>
      </div>

      {/* 5 Dynamic Summary Cards based on Active Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Orders</span>
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl font-heading font-bold mt-1.5 text-foreground">
              {summary.totalOrders.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Matching active filters</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Revenue</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-heading font-bold mt-1.5 text-foreground">
              ₹{summary.totalRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Gross order value</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Online Payments</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-heading font-bold mt-1.5 text-foreground">
              ₹{summary.onlineRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Razorpay / PayU</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Counter Payments</span>
              <Banknote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-heading font-bold mt-1.5 text-foreground">
              ₹{summary.counterRevenue.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Direct in-store cash</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Avg Order Value</span>
              <Store className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-heading font-bold mt-1.5 text-foreground">
              ₹{summary.avgOrderValue.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Per order average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Control Bar with all 5 Server-Side DB Filters */}
      <Card className="shadow-sm border border-border">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Filter 1: Date Range */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">1. Date Range</label>
              <Select value={datePreset} onValueChange={(val: any) => { setDatePreset(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter 2: Shop Selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">2. Print Shop</label>
              <Select value={selectedShopId} onValueChange={(val) => { setSelectedShopId(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Connected Shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Connected Shops ({shops.length})</SelectItem>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.terminal_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter 3: Payment Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">3. Payment Type</label>
              <Select value={paymentType} onValueChange={(val) => { setPaymentType(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Payment Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online (Razorpay / PayU)</SelectItem>
                  <SelectItem value="counter">Counter (Cash / UPI)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter 4: Status */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">4. Status</label>
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed / Paid</SelectItem>
                  <SelectItem value="pending">Pending / In Progress</SelectItem>
                  <SelectItem value="failed">Failed / Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter 5: Search Query */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">5. Text Search</label>
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-3" />
                <Input
                  type="text"
                  placeholder="Order ID, token, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs pr-7"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setPage(1); }}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Custom Date Pickers if 'custom' selected */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">From:</span>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => { setCustomStartDate(e.target.value); setPage(1); }}
                  className="h-8 text-xs w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">To:</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => { setCustomEndDate(e.target.value); setPage(1); }}
                  className="h-8 text-xs w-40"
                />
              </div>
              <Button size="sm" variant="secondary" onClick={() => loadLedgerData()} className="h-8 text-xs">
                Apply Date Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Ledger Table with Sortable Columns */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-heading font-bold">
                Order & Payment Records ({totalCount})
              </CardTitle>
              <CardDescription className="text-xs">
                Server-side paginated results with live status and payment confirmation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th
                    onClick={() => toggleSort('order_number')}
                    className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      <span>Order # / Token</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('created_at')}
                    className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date & Time</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">Shop Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-4 whitespace-nowrap">Document</th>
                  <th
                    onClick={() => toggleSort('total_pages')}
                    className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      <span>Pages</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('grand_total')}
                    className="py-3 px-4 whitespace-nowrap cursor-pointer hover:text-foreground"
                  >
                    <div className="flex items-center gap-1">
                      <span>Amount</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">Payment Mode</th>
                  <th className="py-3 px-4 whitespace-nowrap">Payment Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Querying Supabase database...</span>
                      </div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((ord) => {
                    const isOnline = (ord.payment_method || '').toLowerCase().includes('online') || (ord.payment_method || '').toLowerCase().includes('razorpay');
                    const isCompleted = (ord.payment_status || '').toLowerCase() === 'completed' || (ord.payment_status || '').toLowerCase() === 'paid';

                    return (
                      <tr key={ord.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-foreground font-mono">{ord.order_number}</div>
                          {ord.token_number && (
                            <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 mt-0.5">
                              Token #{ord.token_number}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {new Date(ord.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                          {ord.shop_name || 'Central Kiosk'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div>{ord.customer_name || 'Walk-in User'}</div>
                          {ord.customer_phone && (
                            <div className="text-[10px] text-muted-foreground">{ord.customer_phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap max-w-[160px] truncate" title={ord.document_name || 'Doc'}>
                          {ord.document_name || 'Standard Print Job'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {ord.total_pages || 1} pgs ({ord.config_copies || 1} cp)
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                          ₹{Number(ord.grand_total || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] gap-1 ${
                              isOnline ? 'text-blue-600 bg-blue-500/10' : 'text-emerald-600 bg-emerald-500/10'
                            }`}
                          >
                            {isOnline ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                            {ord.payment_method || 'Counter'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant={isCompleted ? 'default' : 'outline'}
                            className={`text-[10px] capitalize ${isCompleted ? 'bg-emerald-600' : 'text-amber-600'}`}
                          >
                            {ord.payment_status || 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {ord.order_status || 'Submitted'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <AlertCircle className="w-6 h-6 text-muted-foreground/60" />
                        <p className="font-medium">No order transactions match your current database filter criteria.</p>
                        <p className="text-xs text-muted-foreground">Try adjusting the date range or removing selected filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Real Server-Side Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border mt-3 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{orders.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(page * pageSize, totalCount)}</span> of{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> total transactions
            </div>

            <div className="flex items-center space-x-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1 || loading}
                className="h-8 text-xs gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <span className="px-2 text-xs font-medium text-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="h-8 text-xs gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
