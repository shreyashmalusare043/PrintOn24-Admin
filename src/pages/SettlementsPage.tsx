import React, { useEffect, useState } from 'react';
import {
  fetchPaymentTransactions,
  fetchShopSettlements,
  fetchShops,
  markSettlementPaid,
  triggerManualSettlementGeneration
} from '@/services/api';
import type { PaymentTransaction, ShopSettlement, PrintShop } from '@/types/types';
import {
  Banknote,
  CreditCard,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Building2,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProtectedPageWrapper } from '@/components/security/ProtectedPageWrapper';
import { DatabaseFilterBar, FilterState } from '@/components/common/DatabaseFilterBar';
import { toast } from 'sonner';

export const SettlementsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [settlements, setSettlements] = useState<ShopSettlement[]>([]);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    shopIds: [],
    status: 'all',
    paymentType: 'all'
  });

  // Payout Execution Modal
  const [selectedSettlement, setSelectedSettlement] = useState<ShopSettlement | null>(null);
  const [refNote, setRefNote] = useState('');
  const [paying, setPaying] = useState(false);

  // Manual Settlement Generation
  const [manualShopId, setManualShopId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, sData, shData] = await Promise.all([
        fetchPaymentTransactions(100),
        fetchShopSettlements(100),
        fetchShops(100)
      ]);
      setPayments(pData);
      setSettlements(sData);
      setShops(shData);
      if (shData.length > 0 && !manualShopId) {
        setManualShopId(shData[0].id);
      }
    } catch (err) {
      toast.error('Failed to load payments and settlement ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExecutePayout = async () => {
    if (!selectedSettlement) return;
    setPaying(true);
    try {
      await markSettlementPaid(selectedSettlement.id, refNote || 'Bank Transfer Executed');
      setSettlements((prev) =>
        prev.map((s) => (s.id === selectedSettlement.id ? { ...s, status: 'completed', paid_at: new Date().toISOString() } : s))
      );
      toast.success(`Payout of ₹${selectedSettlement.net_payable.toLocaleString()} for ${selectedSettlement.shop_name} marked as Completed!`);
      setSelectedSettlement(null);
      setRefNote('');
    } catch (err) {
      toast.error('Failed to mark settlement as paid');
    } finally {
      setPaying(false);
    }
  };

  const handleGenerateSettlement = async () => {
    if (!manualShopId) return;
    setGenerating(true);
    try {
      const newSettle = await triggerManualSettlementGeneration(manualShopId);
      setSettlements((prev) => [newSettle, ...prev]);
      toast.success(`Calculated 2-day settlement cycle batch for shop!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate settlement');
    } finally {
      setGenerating(false);
    }
  };

  const filteredSettlements = settlements.filter((s) => {
    const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(s.shop_id);
    const matchesStatus = filters.status === 'all' || s.status === filters.status;

    let matchesDate = true;
    if (filters.startDate) {
      const cycleDate = s.cycle_end_date ? s.cycle_end_date.split('T')[0] : '';
      matchesDate = matchesDate && cycleDate >= filters.startDate;
    }
    if (filters.endDate) {
      const cycleDate = s.cycle_start_date ? s.cycle_start_date.split('T')[0] : '';
      matchesDate = matchesDate && cycleDate <= filters.endDate;
    }

    return matchesShop && matchesStatus && matchesDate;
  });

  const filteredPayments = payments.filter((p) => {
    const matchesShop = filters.shopIds.length === 0 || (p.shop_id && filters.shopIds.includes(p.shop_id));
    const matchesStatus = filters.status === 'all' || p.payment_status === filters.status;
    const matchesPayment = filters.paymentType === 'all' || p.payment_method === filters.paymentType;

    let matchesDate = true;
    if (filters.startDate) {
      const pDate = p.created_at ? p.created_at.split('T')[0] : '';
      matchesDate = matchesDate && pDate >= filters.startDate;
    }
    if (filters.endDate) {
      const pDate = p.created_at ? p.created_at.split('T')[0] : '';
      matchesDate = matchesDate && pDate <= filters.endDate;
    }

    return matchesShop && matchesStatus && matchesPayment && matchesDate;
  });

  const pendingSettlements = settlements.filter((s) => s.status === 'pending');
  const completedSettlements = settlements.filter((s) => s.status === 'completed');

  const pendingTotal = pendingSettlements.reduce((sum, s) => sum + (Number(s.net_payable) || 0), 0);
  const completedTotal = completedSettlements.reduce((sum, s) => sum + (Number(s.net_payable) || 0), 0);
  const totalOnlinePayments = payments.filter((p) => p.payment_method === 'online').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <ProtectedPageWrapper
      type="settlement_payout"
      pageTitle="Settlement & Payout Management"
      description="Enter the 6-digit Settlement & Payout Security Password to unlock payout disbursement ledgers."
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Online Payments & 2-Day Settlement Cycle
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Track user payments collected via Razorpay, calculate accumulated shop balances over 2-day cycles, and disburse payouts.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Database Filters Bar */}
        <DatabaseFilterBar
          filters={filters}
          onFilterChange={setFilters}
          shops={shops}
          showShopFilter={true}
          showStatusFilter={true}
          statusOptions={[
            { label: 'All Statuses', value: 'all' },
            { label: 'Pending Settlement', value: 'pending' },
            { label: 'Completed / Paid', value: 'completed' }
          ]}
          showPaymentFilter={true}
          paymentOptions={[
            { label: 'All Methods', value: 'all' },
            { label: 'Razorpay Online Only', value: 'online' },
            { label: 'Counter Cash Only', value: 'counter' }
          ]}
        />

      {/* 2-Day Settlement Status Highlight Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-amber-500/20 bg-amber-500/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Pending 2-Day Payouts</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-heading font-extrabold mt-2 text-foreground">
              ₹{pendingTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {pendingSettlements.length} shops awaiting disbursement
            </p>
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Settled & Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-heading font-extrabold mt-2 text-foreground">
              ₹{completedTotal.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {completedSettlements.length} cycles disbursed successfully
            </p>
          </CardContent>
        </Card>

        <Card className="border border-blue-500/20 bg-blue-500/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Razorpay Inflow</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-heading font-extrabold mt-2 text-foreground">
              ₹{totalOnlinePayments.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              5% platform commission retained
            </p>
          </CardContent>
        </Card>
      </div>

        <Tabs defaultValue="settlements" className="w-full">
          <TabsList className="grid grid-cols-2 h-9 text-xs max-w-md">
            <TabsTrigger value="settlements" className="text-xs">
              2-Day Settlements ({filteredSettlements.length})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs">
              Razorpay Online Ledger ({filteredPayments.length})
            </TabsTrigger>
          </TabsList>

        {/* SETTLEMENTS TAB */}
        <TabsContent value="settlements" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-heading font-bold">Shop Payouts & Settlement Cycles</CardTitle>
                  <CardDescription className="text-xs">
                    Every 2 days, accumulated online revenue is computed and queued for Super Admin approval
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={manualShopId}
                    onChange={(e) => setManualShopId(e.target.value)}
                    className="h-8 text-xs border border-border rounded-md px-2 bg-background"
                  >
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateSettlement}
                    disabled={generating}
                    className="h-8 text-xs"
                  >
                    Calculate 2-Day Cycle
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Shop Name</th>
                      <th className="py-3 px-4 whitespace-nowrap">Cycle Period</th>
                      <th className="py-3 px-4 whitespace-nowrap">Orders</th>
                      <th className="py-3 px-4 whitespace-nowrap">Gross Online</th>
                      <th className="py-3 px-4 whitespace-nowrap">Platform Fee (5%)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Net Payable</th>
                      <th className="py-3 px-4 whitespace-nowrap">Bank Info</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSettlements.map((s) => {
                      const isPending = s.status === 'pending';
                      return (
                        <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                            {s.shop_name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                            {new Date(s.cycle_start_date).toLocaleDateString()} - {new Date(s.cycle_end_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-medium">
                            {s.total_orders} Orders
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-foreground">
                            ₹{s.gross_amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                            ₹{s.platform_commission.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                            ₹{s.net_payable.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px]">
                            {s.bank_ifsc || 'HDFC0001234'} ({s.bank_account_no ? `••••${s.bank_account_no.slice(-4)}` : '••••1012'})
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge
                              variant={isPending ? 'secondary' : 'default'}
                              className={`text-[10px] ${
                                isPending ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30' : 'bg-emerald-600'
                              }`}
                            >
                              {isPending ? 'Pending Payout' : 'Completed'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            {isPending ? (
                              <Button
                                size="sm"
                                onClick={() => setSelectedSettlement(s)}
                                className="h-7 text-xs px-2.5 bg-primary text-primary-foreground"
                              >
                                Pay Out
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                                <Check className="w-3 h-3 text-emerald-600" /> Settled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RAZORPAY TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading font-bold">Raw Payment Inflow Ledger</CardTitle>
              <CardDescription className="text-xs">
                Real-time transactions completed by end-users for print documents via Razorpay or counter cash
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Transaction ID</th>
                      <th className="py-3 px-4 whitespace-nowrap">Date & Time</th>
                      <th className="py-3 px-4 whitespace-nowrap">Shop Identifier</th>
                      <th className="py-3 px-4 whitespace-nowrap">Method</th>
                      <th className="py-3 px-4 whitespace-nowrap">Amount</th>
                      <th className="py-3 px-4 whitespace-nowrap">Razorpay Payment ID</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-foreground">
                          {p.id}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {new Date(p.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold">
                          {p.shop_id}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              p.payment_method === 'online'
                                ? 'border-blue-500/30 text-blue-700 dark:text-blue-300'
                                : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {p.payment_method === 'online' ? 'Razorpay Online' : 'Counter Cash'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                          ₹{p.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                          {p.razorpay_payment_id || 'N/A (Cash)'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="default" className="text-[10px] bg-emerald-600">
                            {p.payment_status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EXECUTE PAYOUT MODAL */}
      <Dialog open={!!selectedSettlement} onOpenChange={(open) => !open && setSelectedSettlement(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">Disburse Settlement Payout</DialogTitle>
            <DialogDescription className="text-xs">
              Confirm bank transfer to shopkeeper for the 2-day accumulated cycle.
            </DialogDescription>
          </DialogHeader>

          {selectedSettlement && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-muted rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shop:</span>
                  <span className="font-bold text-foreground">{selectedSettlement.shop_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cycle Period:</span>
                  <span>{new Date(selectedSettlement.cycle_start_date).toLocaleDateString()} - {new Date(selectedSettlement.cycle_end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Amount:</span>
                  <span>₹{selectedSettlement.gross_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee (5%):</span>
                  <span>-₹{selectedSettlement.platform_commission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5 text-sm font-bold text-foreground">
                  <span>Net Payout:</span>
                  <span className="text-primary">₹{selectedSettlement.net_payable.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Bank Reference / UTR Number (Optional)</Label>
                <Input
                  placeholder="e.g. UTR-9821490219"
                  value={refNote}
                  onChange={(e) => setRefNote(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSettlement(null)}
                  disabled={paying}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecutePayout}
                  disabled={paying}
                  className="text-xs h-8 gap-1.5"
                >
                  {paying ? 'Processing...' : 'Mark Settlement as Completed'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </ProtectedPageWrapper>
  );
};
