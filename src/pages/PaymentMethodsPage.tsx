import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchShops,
  updateShopPaymentConfig,
  bulkUpdateShopPaymentConfig,
  fetchPlatformPaymentSettings,
  updatePlatformPaymentSettings,
  type PlatformPaymentSettings
} from '@/services/api';
import type { PrintShop, PaymentMethodConfig } from '@/types/types';
import {
  CreditCard,
  Banknote,
  ShieldAlert,
  Check,
  RefreshCw,
  Store,
  CheckCircle2,
  Sliders,
  Save,
  Search,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProtectedPageWrapper } from '@/components/security/ProtectedPageWrapper';
import { DatabaseFilterBar, FilterState } from '@/components/common/DatabaseFilterBar';
import { toast } from 'sonner';

export const PaymentMethodsPage: React.FC = () => {
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Selection
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [bulkApplying, setBulkApplying] = useState(false);

  // Platform-level payment settings
  const [platformSettings, setPlatformSettings] = useState<PlatformPaymentSettings>({
    id: 'default',
    commission_rate: 5.0,
    razorpay_enabled: true,
    pay_on_counter_enabled: true,
    payu_enabled: true,
    payout_cycle_days: 2,
    min_payout_amount: 500,
    updated_at: ''
  });
  const [savingPlatform, setSavingPlatform] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    shopIds: [],
    status: 'all',
    paymentType: 'all'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopsData, pSettings] = await Promise.all([
        fetchShops(100),
        fetchPlatformPaymentSettings()
      ]);
      setShops(shopsData);
      setPlatformSettings(pSettings);
    } catch (err) {
      toast.error('Failed to load shop payment configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfigChange = async (shopId: string, newConfig: PaymentMethodConfig) => {
    setUpdatingId(shopId);
    try {
      await updateShopPaymentConfig(shopId, newConfig);
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, payment_method_config: newConfig } : s))
      );
      toast.success(`Payment mode updated to ${newConfig.toUpperCase()} for shop`);
    } catch (err) {
      toast.error('Failed to update payment method in database');
    } finally {
      setUpdatingId(null);
    }
  };

  // Bulk update payment mode
  const handleBulkUpdate = async (mode: PaymentMethodConfig) => {
    if (selectedShopIds.length === 0) {
      toast.error('Please select at least one shop for bulk update');
      return;
    }
    setBulkApplying(true);
    try {
      await bulkUpdateShopPaymentConfig(selectedShopIds, mode);
      setShops((prev) =>
        prev.map((s) =>
          selectedShopIds.includes(s.id) ? { ...s, payment_method_config: mode } : s
        )
      );
      toast.success(`Updated ${selectedShopIds.length} shops to ${mode.toUpperCase()} mode!`);
      setSelectedShopIds([]);
    } catch (err) {
      toast.error('Bulk update failed');
    } finally {
      setBulkApplying(false);
    }
  };

  // Save Platform-level settings
  const handleSavePlatformSettings = async () => {
    setSavingPlatform(true);
    try {
      await updatePlatformPaymentSettings(platformSettings);
      toast.success('Platform-level payment rules saved to database!');
    } catch (err) {
      toast.error('Failed to save platform payment settings');
    } finally {
      setSavingPlatform(false);
    }
  };

  const countBoth = shops.filter((s) => s.payment_method_config === 'both').length;
  const countRazorpay = shops.filter((s) => s.payment_method_config === 'razorpay').length;
  const countCounter = shops.filter((s) => s.payment_method_config === 'counter').length;

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(shop.id);
      const matchesStatus = filters.status === 'all' || shop.status === filters.status;
      const matchesPayment = filters.paymentType === 'all' || shop.payment_method_config === filters.paymentType;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.terminal_code.toLowerCase().includes(q) ||
        (shop.owner_name && shop.owner_name.toLowerCase().includes(q));

      return matchesShop && matchesStatus && matchesPayment && matchesSearch;
    });
  }, [shops, filters, searchQuery]);

  const toggleSelectAll = () => {
    if (selectedShopIds.length === filteredShops.length) {
      setSelectedShopIds([]);
    } else {
      setSelectedShopIds(filteredShops.map((s) => s.id));
    }
  };

  const toggleSelectShop = (id: string) => {
    setSelectedShopIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <ProtectedPageWrapper
      type="payment_methods"
      pageTitle="Payment Methods Configuration"
      description="Enter the 6-digit Payment Methods Security Password to configure cash vs online payment options."
    >
      <div className="space-y-6">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Payment Method Management
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Super Admin controls payment methods for each individual shop: Pay on Counter, Online via Razorpay, or Both.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Platform-Level Payment Settings */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Platform-Level Gateway & Commission Settings
                </CardTitle>
                <CardDescription className="text-xs">
                  Global parameters persisted in Supabase database for gateway toggles and fee percentages
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleSavePlatformSettings}
                disabled={savingPlatform}
                className="h-8 text-xs gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {savingPlatform ? 'Saving...' : 'Save Platform Rules'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border border-border/60">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Razorpay Gateway</span>
                  <Switch
                    checked={platformSettings.razorpay_enabled}
                    onCheckedChange={(checked) =>
                      setPlatformSettings((p) => ({ ...p, razorpay_enabled: checked }))
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Global switch for credit card, debit card & netbanking
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border border-border/60">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Pay on Counter Mode</span>
                  <Switch
                    checked={platformSettings.pay_on_counter_enabled}
                    onCheckedChange={(checked) =>
                      setPlatformSettings((p) => ({ ...p, pay_on_counter_enabled: checked }))
                    }
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Allow physical counter payment collection
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 border border-border/60">
                <Label htmlFor="commRate" className="text-xs font-semibold">
                  Platform Commission (%)
                </Label>
                <Input
                  id="commRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={platformSettings.commission_rate}
                  onChange={(e) =>
                    setPlatformSettings((p) => ({ ...p, commission_rate: Number(e.target.value) }))
                  }
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Retained fee on online orders</p>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 border border-border/60">
                <Label htmlFor="cycleDays" className="text-xs font-semibold">
                  Payout Cycle Interval
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cycleDays"
                    type="number"
                    value={platformSettings.payout_cycle_days}
                    onChange={(e) =>
                      setPlatformSettings((p) => ({ ...p, payout_cycle_days: Number(e.target.value) }))
                    }
                    className="h-8 text-xs w-20"
                  />
                  <span className="text-xs text-muted-foreground">Days (48h cycle)</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Default 2 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Filter Bar */}
        <DatabaseFilterBar
          filters={filters}
          onFilterChange={setFilters}
          shops={shops}
          showShopFilter={true}
          showStatusFilter={true}
          statusOptions={[
            { label: 'All Statuses', value: 'all' },
            { label: 'Active Shops', value: 'active' },
            { label: 'Inactive Shops', value: 'inactive' }
          ]}
          showPaymentFilter={true}
          paymentOptions={[
            { label: 'All Modes', value: 'all' },
            { label: 'Counter Only', value: 'counter' },
            { label: 'Online / Razorpay Only', value: 'razorpay' },
            { label: 'Both Modes', value: 'both' }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-purple-500/20 bg-purple-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Dual Mode (Both)</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-heading font-extrabold mt-2 text-foreground">{countBoth} Shops</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Online Razorpay + In-store Cash</p>
            </CardContent>
          </Card>

          <Card className="border border-blue-500/20 bg-blue-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Razorpay Online Only</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-heading font-extrabold mt-2 text-foreground">{countRazorpay} Shops</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Contactless 100% Pre-paid</p>
            </CardContent>
          </Card>

          <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Pay on Counter Only</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-heading font-extrabold mt-2 text-foreground">{countCounter} Shops</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Physical Counter Checkout</p>
            </CardContent>
          </Card>
        </div>

        {/* Shop-wise Configuration Matrix & Bulk Operations */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-heading font-bold">Shop-Specific Payment Configuration</CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredShops.length} of {shops.length} shops. Changes update the shared database immediately.
                </CardDescription>
              </div>

              {/* Bulk Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                  <Input
                    placeholder="Search shop or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs pl-8 w-44"
                  />
                </div>

                {selectedShopIds.length > 0 && (
                  <div className="flex items-center gap-1.5 p-1 bg-muted rounded-md">
                    <span className="text-[11px] font-medium px-1.5">{selectedShopIds.length} Selected:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkApplying}
                      onClick={() => handleBulkUpdate('both')}
                      className="h-7 text-[10px] px-2"
                    >
                      Set Both
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkApplying}
                      onClick={() => handleBulkUpdate('razorpay')}
                      className="h-7 text-[10px] px-2"
                    >
                      Set Online
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkApplying}
                      onClick={() => handleBulkUpdate('counter')}
                      className="h-7 text-[10px] px-2"
                    >
                      Set Counter
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={filteredShops.length > 0 && selectedShopIds.length === filteredShops.length}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="py-3 px-4 whitespace-nowrap">Shop Name</th>
                    <th className="py-3 px-4 whitespace-nowrap">Terminal Code</th>
                    <th className="py-3 px-4 whitespace-nowrap">Current Setting</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Pay on Counter</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Razorpay Online</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Both Modes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredShops.map((shop) => {
                    const isBoth = shop.payment_method_config === 'both';
                    const isRazorpay = shop.payment_method_config === 'razorpay';
                    const isCounter = shop.payment_method_config === 'counter';
                    const isUpdating = updatingId === shop.id;

                    return (
                      <tr key={shop.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedShopIds.includes(shop.id)}
                            onChange={() => toggleSelectShop(shop.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                          {shop.name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {shop.terminal_code}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isBoth && (
                            <Badge className="bg-purple-600 text-[10px]">
                              Both (Online + Cash)
                            </Badge>
                          )}
                          {isRazorpay && (
                            <Badge className="bg-blue-600 text-[10px]">
                              Razorpay Only
                            </Badge>
                          )}
                          {isCounter && (
                            <Badge className="bg-emerald-600 text-[10px]">
                              Counter Cash Only
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <Button
                            variant={isCounter ? 'default' : 'outline'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleConfigChange(shop.id, 'counter')}
                            className={`h-7 text-[11px] px-2.5 ${isCounter ? 'bg-emerald-600' : ''}`}
                          >
                            {isCounter && <Check className="w-3 h-3 mr-1" />}
                            Counter Only
                          </Button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <Button
                            variant={isRazorpay ? 'default' : 'outline'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleConfigChange(shop.id, 'razorpay')}
                            className={`h-7 text-[11px] px-2.5 ${isRazorpay ? 'bg-blue-600' : ''}`}
                          >
                            {isRazorpay && <Check className="w-3 h-3 mr-1" />}
                            Razorpay Only
                          </Button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <Button
                            variant={isBoth ? 'default' : 'outline'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleConfigChange(shop.id, 'both')}
                            className={`h-7 text-[11px] px-2.5 ${isBoth ? 'bg-purple-600' : ''}`}
                          >
                            {isBoth && <Check className="w-3 h-3 mr-1" />}
                            Dual Mode
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedPageWrapper>
  );
};
