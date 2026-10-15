import React, { useEffect, useState } from 'react';
import { fetchPCRequests, reviewPCRequest, fetchShops, updateShopPCLimitDirect } from '@/services/api';
import type { ShopPCRequest, PrintShop } from '@/types/types';
import { Cpu, Check, X, ShieldAlert, Clock, RefreshCw, Plus, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { DatabaseFilterBar, FilterState } from '@/components/common/DatabaseFilterBar';
import { toast } from 'sonner';

export const PCManagementPage: React.FC = () => {
  const [requests, setRequests] = useState<ShopPCRequest[]>([]);
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

  // Review modal
  const [selectedRequest, setSelectedRequest] = useState<ShopPCRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState<number>(500);
  const [reviewing, setReviewing] = useState(false);

  // Direct adjustment modal
  const [adjustShop, setAdjustShop] = useState<PrintShop | null>(null);
  const [newLimit, setNewLimit] = useState(2);
  const [savingLimit, setSavingLimit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rData, sData] = await Promise.all([
        fetchPCRequests(),
        fetchShops(100)
      ]);
      setRequests(rData);
      setShops(sData);
    } catch (err) {
      toast.error('Failed to load PC capacity requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReviewModal = (req: ShopPCRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setActionType(action);
    setAdminNotes(action === 'approve' ? 'Approved based on shop high customer volume.' : 'PC quota exceeded.');
    setAdditionalCharges(req.additional_charges || 500);
  };

  const handleReviewSubmit = async () => {
    if (!selectedRequest) return;
    setReviewing(true);
    try {
      await reviewPCRequest(selectedRequest.id, actionType, adminNotes, additionalCharges);
      toast.success(`Request marked as ${actionType === 'approve' ? 'Approved & PC Limit increased' : 'Rejected'}`);
      setSelectedRequest(null);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update PC request');
    } finally {
      setReviewing(false);
    }
  };

  const handleDirectLimitUpdate = async () => {
    if (!adjustShop) return;
    setSavingLimit(true);
    try {
      await updateShopPCLimitDirect(adjustShop.id, newLimit);
      setShops((prev) => prev.map((s) => (s.id === adjustShop.id ? { ...s, pc_limit: newLimit } : s)));
      toast.success(`Updated ${adjustShop.name} PC limit to ${newLimit} terminals`);
      setAdjustShop(null);
    } catch (err) {
      toast.error('Failed to update PC limit');
    } finally {
      setSavingLimit(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(req.shop_id);
    const matchesStatus = filters.status === 'all' || req.status === filters.status;

    let matchesDate = true;
    if (filters.startDate) {
      const created = req.created_at ? req.created_at.split('T')[0] : '';
      matchesDate = matchesDate && created >= filters.startDate;
    }
    if (filters.endDate) {
      const created = req.created_at ? req.created_at.split('T')[0] : '';
      matchesDate = matchesDate && created <= filters.endDate;
    }

    return matchesShop && matchesStatus && matchesDate;
  });

  const filteredShops = shops.filter((shop) => {
    const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(shop.id);
    const matchesStatus = filters.status === 'all' || shop.status === filters.status;
    return matchesShop && matchesStatus;
  });

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            PC Capacity & Terminal Management
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Default allocation: <strong>2 PCs per shop</strong>. Review incoming extra PC capacity upgrade requests, approve limits, and record additional fees.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
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
          { label: 'Pending Approval', value: 'pending' },
          { label: 'Approved Requests', value: 'approved' },
          { label: 'Rejected Requests', value: 'rejected' }
        ]}
        showPaymentFilter={false}
      />

      {/* Incoming Requests Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> Extra PC Capacity Upgrade Requests
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredRequests.length} of {requests.length} requests. Submitted by shopkeepers needing additional counter PCs.
              </CardDescription>
            </div>
            {pendingRequests.length > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">
                {pendingRequests.length} Pending Approval
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Shop Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Current Limit</th>
                  <th className="py-3 px-4 whitespace-nowrap">Requested PCs</th>
                  <th className="py-3 px-4 whitespace-nowrap">Reason</th>
                  <th className="py-3 px-4 whitespace-nowrap">Addl. Charges</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Submitted At</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const isPending = req.status === 'pending';
                    return (
                      <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                          {req.shop_name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.current_pc_limit} PCs
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-primary">
                          +{req.requested_pcs} PCs
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground max-w-xs truncate">
                          {req.reason || 'High customer print volume'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-semibold">
                          ₹{req.additional_charges.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant={isPending ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'}
                            className={`text-[10px] capitalize ${req.status === 'approved' ? 'bg-emerald-600' : ''}`}
                          >
                            {req.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-1">
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openReviewModal(req, 'approve')}
                                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewModal(req, 'reject')}
                                className="h-7 text-xs px-2.5 text-destructive hover:bg-destructive/10"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No PC capacity requests currently recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Connected Shops Terminal Roster */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading font-bold">Shop PC Allocations Roster</CardTitle>
          <CardDescription className="text-xs">
            Directly adjust authorized terminal count per shop as needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Shop Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Terminal Code</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Allocated PC Limit</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Quick Edit Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                      {shop.name}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {shop.terminal_code}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {shop.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                      {shop.pc_limit || 2} Terminals
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdjustShop(shop);
                          setNewLimit(shop.pc_limit || 2);
                        }}
                        className="h-7 text-xs px-2"
                      >
                        Adjust Capacity
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* REVIEW REQUEST MODAL */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {actionType === 'approve' ? 'Approve PC Capacity Upgrade' : 'Reject PC Capacity Upgrade'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {actionType === 'approve'
                ? 'Approving will automatically increment the shop authorized PC limit in the database.'
                : 'Rejecting will keep the current PC limit unchanged.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shop:</span>
                  <span className="font-bold text-foreground">{selectedRequest.shop_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Limit:</span>
                  <span>{selectedRequest.current_pc_limit} PCs</span>
                </div>
                <div className="flex justify-between font-bold text-primary">
                  <span>Additional Requested:</span>
                  <span>+{selectedRequest.requested_pcs} PCs (Total: {selectedRequest.current_pc_limit + selectedRequest.requested_pcs} PCs)</span>
                </div>
              </div>

              {actionType === 'approve' && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Additional Charges Recorded (₹)</Label>
                  <Input
                    type="number"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Admin Resolution Note</Label>
                <Input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)} disabled={reviewing} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleReviewSubmit}
                  disabled={reviewing}
                  className={`h-8 text-xs ${actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive'}`}
                >
                  {reviewing ? 'Saving...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIRECT ADJUST MODAL */}
      <Dialog open={!!adjustShop} onOpenChange={(open) => !open && setAdjustShop(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">Adjust Shop PC Limit</DialogTitle>
            <DialogDescription className="text-xs">
              Directly override the max concurrent PCs for {adjustShop?.name}.
            </DialogDescription>
          </DialogHeader>

          {adjustShop && (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">New Terminal Limit</Label>
                <Input
                  type="number"
                  min={1}
                  max={25}
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseInt(e.target.value) || 1)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setAdjustShop(null)} disabled={savingLimit} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleDirectLimitUpdate} disabled={savingLimit} className="h-8 text-xs">
                  {savingLimit ? 'Saving...' : 'Update Limit'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
