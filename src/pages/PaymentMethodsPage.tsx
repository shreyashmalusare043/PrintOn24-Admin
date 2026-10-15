import React, { useEffect, useState } from 'react';
import { fetchShops, updateShopPaymentConfig } from '@/services/api';
import type { PrintShop, PaymentMethodConfig } from '@/types/types';
import { CreditCard, Banknote, ShieldAlert, Check, RefreshCw, Store, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProtectedPageWrapper } from '@/components/security/ProtectedPageWrapper';
import { DatabaseFilterBar, FilterState } from '@/components/common/DatabaseFilterBar';
import { toast } from 'sonner';

export const PaymentMethodsPage: React.FC = () => {
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    shopIds: [],
    status: 'all',
    paymentType: 'all'
  });

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await fetchShops(100);
      setShops(data);
    } catch (err) {
      toast.error('Failed to load shop payment configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handleConfigChange = async (shopId: string, newConfig: PaymentMethodConfig) => {
    setUpdatingId(shopId);
    try {
      await updateShopPaymentConfig(shopId, newConfig);
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, payment_method_config: newConfig } : s))
      );
      toast.success(`Payment mode updated to ${newConfig.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update payment method');
    } finally {
      setUpdatingId(null);
    }
  };

  const countBoth = shops.filter((s) => s.payment_method_config === 'both').length;
  const countRazorpay = shops.filter((s) => s.payment_method_config === 'razorpay').length;
  const countCounter = shops.filter((s) => s.payment_method_config === 'counter').length;

  const filteredShops = shops.filter((shop) => {
    const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(shop.id);
    const matchesStatus = filters.status === 'all' || shop.status === filters.status;
    const matchesPayment = filters.paymentType === 'all' || shop.payment_method_config === filters.paymentType;

    let matchesDate = true;
    if (filters.startDate) {
      const created = shop.created_at ? shop.created_at.split('T')[0] : '';
      matchesDate = matchesDate && created >= filters.startDate;
    }
    if (filters.endDate) {
      const created = shop.created_at ? shop.created_at.split('T')[0] : '';
      matchesDate = matchesDate && created <= filters.endDate;
    }

    return matchesShop && matchesStatus && matchesPayment && matchesDate;
  });

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
          <Button variant="outline" size="sm" onClick={loadShops} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

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

        {/* Shop-wise Configuration Matrix */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading font-bold">Shop-Specific Payment Configuration</CardTitle>
            <CardDescription className="text-xs">
              Showing {filteredShops.length} of {shops.length} shops. Changes update the shared database immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                  <tr>
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
                    const current = shop.payment_method_config || 'both';
                    const isUpdating = updatingId === shop.id;

                    return (
                      <tr key={shop.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                          {shop.name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                          {shop.terminal_code}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              current === 'both'
                                ? 'border-purple-500/40 text-purple-700 dark:text-purple-300'
                                : current === 'razorpay'
                                ? 'border-blue-500/40 text-blue-700 dark:text-blue-300'
                                : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {current === 'both'
                              ? 'Both Enabled'
                              : current === 'razorpay'
                              ? 'Razorpay Only'
                              : 'Counter Only'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <Button
                            variant={current === 'counter' ? 'default' : 'outline'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleConfigChange(shop.id, 'counter')}
                            className="h-7 text-xs px-2.5"
                          >
                            {current === 'counter' && <Check className="w-3 h-3 mr-1" />}
                            Counter Only
                          </Button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <Button
                            variant={current === 'razorpay' ? 'default' : 'outline'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleConfigChange(shop.id, 'razorpay')}
                            className="h-7 text-xs px-2.5"
                          >
                            {current === 'razorpay' && <Check className="w-3 h-3 mr-1" />}
                            Razorpay Only
                          </Button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <Button
                            variant={current === 'both' ? 'default' : 'outline'}
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleConfigChange(shop.id, 'both')}
                            className="h-7 text-xs px-2.5"
                          >
                            {current === 'both' && <Check className="w-3 h-3 mr-1" />}
                            Both Modes
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
