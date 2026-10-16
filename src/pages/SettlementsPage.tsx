import React, { useEffect, useState, useMemo } from 'react';
import {
  fetchPaymentTransactions,
  fetchShopSettlements,
  fetchRealOrderSettlements,
  fetchShops,
  markSettlementPaid,
  markRealSettlementPaid,
  updateSettlementStatus,
  bulkMarkSettlementsPaid,
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
  Check,
  XCircle,
  FileCheck,
  Download,
  AlertTriangle,
  RotateCcw
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
import { Textarea } from '@/components/ui/textarea';
import { ProtectedPageWrapper } from '@/components/security/ProtectedPageWrapper';
import { DatabaseFilterBar, FilterState } from '@/components/common/DatabaseFilterBar';
import { toast } from 'sonner';

export const SettlementsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [settlements, setSettlements] = useState<ShopSettlement[]>([]);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected item checkboxes for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
  const [payoutModal, setPayoutModal] = useState<ShopSettlement | null>(null);
  const [payoutRefNote, setPayoutRefNote] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Rejection Modal
  const [rejectModal, setRejectModal] = useState<ShopSettlement | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Manual Settlement Generation
  const [manualShopId, setManualShopId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, sData, shData] = await Promise.all([
        fetchPaymentTransactions(200),
        fetchRealOrderSettlements(),
        fetchShops(100)
      ]);
      setPayments(pData);
      setSettlements(sData.settlements);
      setShops(shData);
      if (shData.length > 0 && !manualShopId) {
        setManualShopId(shData[0].id);
      }
    } catch (err) {
      toast.error('Failed to load settlements from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Status transitions
  const handleMoveToProcessing = async (settlement: ShopSettlement) => {
    try {
      await updateSettlementStatus(settlement.id, 'processing');
      setSettlements((prev) =>
        prev.map((s) => (s.id === settlement.id ? { ...s, status: 'processing' as any } : s))
      );
      toast.info(`Settlement for ${settlement.shop_name} marked as In Review / Processing`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleExecutePayout = async () => {
    if (!payoutModal) return;
    setIsProcessingAction(true);
    try {
      await markRealSettlementPaid(payoutModal, payoutRefNote || 'Bank Transfer Executed');
      setSettlements((prev) =>
        prev.map((s) =>
          s.id === payoutModal.id
            ? { ...s, status: 'completed', paid_at: new Date().toISOString() }
            : s
        )
      );
      toast.success(`Payout of ₹${payoutModal.net_payable.toLocaleString()} for ${payoutModal.shop_name} marked as Paid!`);
      setPayoutModal(null);
      setPayoutRefNote('');
    } catch (err) {
      toast.error('Failed to disburse settlement');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleExecuteReject = async () => {
    if (!rejectModal) return;
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason');
      return;
    }
    setIsProcessingAction(true);
    try {
      await updateSettlementStatus(rejectModal.id, 'rejected', {
        rejectionReason: rejectionReason.trim()
      });
      setSettlements((prev) =>
        prev.map((s) =>
          s.id === rejectModal.id
            ? { ...s, status: 'rejected' as any, rejection_reason: rejectionReason.trim() }
            : s
        )
      );
      toast.warning(`Settlement for ${rejectModal.shop_name} has been rejected`);
      setRejectModal(null);
      setRejectionReason('');
    } catch (err) {
      toast.error('Failed to reject settlement');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Bulk Mark Paid
  const handleBulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessingAction(true);
    try {
      const selectedSettlements = settlements.filter((s) => selectedIds.includes(s.id));
      await bulkMarkSettlementsPaid(selectedSettlements, 'Bulk Super Admin Payout');
      setSettlements((prev) =>
        prev.map((s) =>
          selectedIds.includes(s.id)
            ? { ...s, status: 'completed', paid_at: new Date().toISOString() }
            : s
        )
      );
      toast.success(`Successfully marked ${selectedIds.length} settlements as Paid!`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to complete bulk payout');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleGenerateSettlement = async () => {
    if (!manualShopId) return;
    setGenerating(true);
    try {
      const newSettle = await triggerManualSettlementGeneration(manualShopId);
      setSettlements((prev) => [newSettle, ...prev]);
      toast.success(`Generated 2-day settlement cycle batch for ${newSettle.shop_name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate settlement');
    } finally {
      setGenerating(false);
    }
  };

  // Cycle Type Tab Filter
  const [cycleTab, setCycleTab] = useState<'all' | 'current' | 'previous' | 'earlier'>('all');

  // Filter application
  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(s.shop_id);
      const matchesStatus = filters.status === 'all' || s.status === filters.status;
      const matchesCycle = cycleTab === 'all' || s.cycle_type === cycleTab;

      let matchesDate = true;
      if (filters.startDate) {
        const cycleDate = s.cycle_end_date ? s.cycle_end_date.split('T')[0] : '';
        matchesDate = matchesDate && cycleDate >= filters.startDate;
      }
      if (filters.endDate) {
        const cycleDate = s.cycle_start_date ? s.cycle_start_date.split('T')[0] : '';
        matchesDate = matchesDate && cycleDate <= filters.endDate;
      }

      return matchesShop && matchesStatus && matchesCycle && matchesDate;
    });
  }, [settlements, filters, cycleTab]);

  // Summaries
  const pendingSettlements = settlements.filter((s) => s.status === 'pending' || (s.status as any) === 'processing');
  const completedSettlements = settlements.filter((s) => s.status === 'completed');

  const pendingTotal = pendingSettlements.reduce((sum, s) => sum + (Number(s.net_payable) || 0), 0);
  const completedTotal = completedSettlements.reduce((sum, s) => sum + (Number(s.net_payable) || 0), 0);
  const totalCommission = settlements.reduce((sum, s) => sum + (Number(s.platform_commission) || 0), 0);

  // Dynamic next settlement cycle date (48-hour cycle ending date)
  const nextSettlementDate = useMemo(() => {
    const d = new Date('2026-10-11T00:00:00Z');
    d.setDate(d.getDate() + 1); // 12 Oct 2026
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const handleExportCSV = () => {
    if (filteredSettlements.length === 0) {
      toast.error('No settlements to export');
      return;
    }
    const headers = ['Settlement ID', 'Shop Name', 'Cycle Start', 'Cycle End', 'Total Orders', 'Gross (₹)', 'Commission (₹)', 'Net Payable (₹)', 'Status', 'Paid At'];
    const rows = filteredSettlements.map((s) => [
      `"${s.id}"`,
      `"${s.shop_name}"`,
      `"${s.cycle_start_date || ''}"`,
      `"${s.cycle_end_date || ''}"`,
      s.total_orders,
      s.gross_amount,
      s.platform_commission,
      s.net_payable,
      `"${s.status}"`,
      `"${s.paid_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PrintOn24_Settlements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported settlements to CSV');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSettlements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSettlements.map((s) => s.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
              Disburse accumulated Razorpay revenues over automated 2-day cycles to verified shopkeeper bank accounts.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportCSV} className="h-9 gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
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
            { label: 'Pending Payout', value: 'pending' },
            { label: 'In Review / Processing', value: 'processing' },
            { label: 'Completed / Paid', value: 'completed' },
            { label: 'Rejected', value: 'rejected' }
          ]}
          showPaymentFilter={false}
        />

        {/* 4 Summary Cards based on Live DB Calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-amber-500/20 bg-amber-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Pending Payouts</span>
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
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Completed Payouts</span>
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
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Total Commission</span>
                <Banknote className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-heading font-extrabold mt-2 text-foreground">
                ₹{totalCommission.toLocaleString()}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                5% platform fee retained
              </p>
            </CardContent>
          </Card>

          <Card className="border border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Next Settlement Date</span>
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xl font-heading font-extrabold mt-2 text-foreground">
                {nextSettlementDate}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Scheduled 48-Hour Cycle Close
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Settlement Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-heading font-bold">
                  2-Day Settlement Cycles ({filteredSettlements.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Review shop cycles, approve or process payouts, and audit bank disbursement details
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedIds.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleBulkMarkPaid}
                    disabled={isProcessingAction}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Mark {selectedIds.length} as Paid
                  </Button>
                )}

                <div className="flex items-center gap-1.5">
                  <select
                    value={manualShopId}
                    onChange={(e) => setManualShopId(e.target.value)}
                    className="h-8 text-xs border border-border rounded-md px-2 bg-background max-w-[150px]"
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
                    className="h-8 text-xs shrink-0"
                  >
                    {generating ? 'Calculating...' : 'Calculate Cycle'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Tabs value={cycleTab} onValueChange={(v: any) => setCycleTab(v)} className="w-full">
                <TabsList className="grid grid-cols-4 h-9 max-w-xl text-xs">
                  <TabsTrigger value="all" className="text-xs">All Cycles</TabsTrigger>
                  <TabsTrigger value="current" className="text-xs font-semibold text-primary">Current (15-16 Oct)</TabsTrigger>
                  <TabsTrigger value="previous" className="text-xs">Previous (13-14 Oct)</TabsTrigger>
                  <TabsTrigger value="earlier" className="text-xs">Earlier Cycles</TabsTrigger>
                </TabsList>
              </Tabs>
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
                        checked={filteredSettlements.length > 0 && selectedIds.length === filteredSettlements.length}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="py-3 px-4 whitespace-nowrap">Shop Name</th>
                    <th className="py-3 px-4 whitespace-nowrap">Cycle Period</th>
                    <th className="py-3 px-4 whitespace-nowrap">Orders</th>
                    <th className="py-3 px-4 whitespace-nowrap">Gross Online</th>
                    <th className="py-3 px-4 whitespace-nowrap">Fee (5%)</th>
                    <th className="py-3 px-4 whitespace-nowrap">Net Payable</th>
                    <th className="py-3 px-4 whitespace-nowrap">Bank Info</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-muted-foreground">
                        Loading settlements from database...
                      </td>
                    </tr>
                  ) : filteredSettlements.length > 0 ? (
                    filteredSettlements.map((s) => {
                      const isPending = s.status === 'pending';
                      const isProcessing = (s.status as any) === 'processing';
                      const isCompleted = s.status === 'completed';
                      const isRejected = (s.status as any) === 'rejected';

                      return (
                        <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(s.id)}
                              onChange={() => toggleSelectId(s.id)}
                              className="rounded border-border"
                            />
                          </td>
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
                            ₹{Number(s.gross_amount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                            ₹{Number(s.platform_commission || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                            ₹{Number(s.net_payable || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                            {s.bank_account_no ? (
                              <div className="space-y-0.5">
                                <div className="font-mono text-[11px] font-semibold text-foreground">
                                  ••••{s.bank_account_no.slice(-4)} ({s.bank_ifsc || 'N/A'})
                                </div>
                                {s.upi_id && (
                                  <div className="text-[10px] text-muted-foreground font-mono">
                                    UPI: {s.upi_id}
                                  </div>
                                )}
                              </div>
                            ) : s.upi_id ? (
                              <div className="font-mono text-[11px] text-foreground font-semibold">
                                UPI: {s.upi_id}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] bg-amber-500/5">
                                Not added
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isCompleted && (
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                Paid & Settled
                              </Badge>
                            )}
                            {isPending && (
                              <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 text-[10px]">
                                Pending Review
                              </Badge>
                            )}
                            {isProcessing && (
                              <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10 text-[10px]">
                                In Processing
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge variant="destructive" className="text-[10px]">
                                Rejected
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMoveToProcessing(s)}
                                    className="h-7 text-[11px] px-2 text-blue-600 hover:text-blue-700"
                                  >
                                    Review
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => setPayoutModal(s)}
                                    className="h-7 text-[11px] px-2.5 bg-primary text-primary-foreground"
                                  >
                                    Disburse
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRejectModal(s)}
                                    className="h-7 text-[11px] px-2 text-destructive hover:text-destructive"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {isProcessing && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => setPayoutModal(s)}
                                    className="h-7 text-[11px] px-2.5 bg-emerald-600 text-white hover:bg-emerald-700"
                                  >
                                    Approve & Pay
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRejectModal(s)}
                                    className="h-7 text-[11px] px-2 text-destructive hover:text-destructive"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}

                              {isCompleted && (
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Settled
                                </span>
                              )}

                              {isRejected && (
                                <span className="text-[11px] text-destructive flex items-center gap-1" title={s.rejection_reason || 'Rejected'}>
                                  <XCircle className="w-3.5 h-3.5 text-destructive" /> Rejected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-muted-foreground">
                        No settlements match your filter selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog: Execute Payout with Reference Note */}
        <Dialog open={!!payoutModal} onOpenChange={(open) => !open && setPayoutModal(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-base font-bold">
                <Banknote className="w-5 h-5 text-primary" />
                <span>Confirm Bank Payout Disbursement</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mark 2-day cycle settlement as Paid and record bank transaction reference.
              </DialogDescription>
            </DialogHeader>

            {payoutModal && (
              <div className="space-y-4 py-2 text-xs">
                <div className="p-3 bg-muted/60 rounded-lg space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shop Name:</span>
                    <span className="font-semibold text-foreground">{payoutModal.shop_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Payout Amount:</span>
                    <span className="font-bold text-foreground text-sm">₹{Number(payoutModal.net_payable).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beneficiary Account:</span>
                    <span className="font-mono">
                      {payoutModal.bank_account_no
                        ? `••••${payoutModal.bank_account_no.slice(-4)} (${payoutModal.bank_ifsc || 'N/A'})`
                        : payoutModal.upi_id
                        ? `UPI: ${payoutModal.upi_id}`
                        : 'Not added'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payoutRef" className="text-xs font-semibold">Bank UTR / Transaction Reference Note</Label>
                  <Input
                    id="payoutRef"
                    placeholder="e.g. UTR-9821873912 or IMPS-Bank-Transfer"
                    value={payoutRefNote}
                    onChange={(e) => setPayoutRefNote(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setPayoutModal(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecutePayout}
                disabled={isProcessingAction}
                className="h-8 text-xs bg-primary text-primary-foreground font-semibold"
              >
                {isProcessingAction ? 'Processing...' : 'Confirm & Disburse'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Reject Settlement */}
        <Dialog open={!!rejectModal} onOpenChange={(open) => !open && setRejectModal(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-base font-bold text-destructive">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span>Reject Settlement Cycle</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Provide a mandatory reason for rejecting this shop's cycle settlement.
              </DialogDescription>
            </DialogHeader>

            {rejectModal && (
              <div className="space-y-4 py-2 text-xs">
                <p className="text-muted-foreground">
                  You are rejecting settlement for <strong>{rejectModal.shop_name}</strong> (Amount: ₹{Number(rejectModal.net_payable).toLocaleString()}).
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="rejectReason" className="text-xs font-semibold">Rejection Reason</Label>
                  <Textarea
                    id="rejectReason"
                    rows={3}
                    placeholder="e.g. Bank IFSC code mismatch or order dispute investigation"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectModal(null)} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleExecuteReject}
                disabled={isProcessingAction}
                className="h-8 text-xs font-semibold"
              >
                {isProcessingAction ? 'Rejecting...' : 'Reject Settlement'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPageWrapper>
  );
};
