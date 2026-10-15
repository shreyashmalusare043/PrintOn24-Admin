import React, { useEffect, useState } from 'react';
import {
  fetchSubscriptionPlans,
  saveSubscriptionPlan,
  togglePlanStatus,
  fetchShopSubscriptions,
  fetchShops,
  assignShopSubscription
} from '@/services/api';
import type { SubscriptionPlan, ShopSubscription, PrintShop } from '@/types/types';
import { Layers, Plus, Check, Clock, ShieldCheck, RefreshCw, Star, Edit3 } from 'lucide-react';
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

export const SubscriptionsPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [shopSubs, setShopSubs] = useState<ShopSubscription[]>([]);
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

  // Edit / Create plan modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan>>({
    name: '',
    price: 999,
    duration_days: 30,
    pc_limit: 2,
    features: ['Basic Support', 'Online Print Orders'],
    services: ['Standard Xerox', 'B&W Print'],
    is_active: true,
    is_popular: false
  });
  const [featuresStr, setFeaturesStr] = useState('');
  const [submittingPlan, setSubmittingPlan] = useState(false);

  // Assign Plan Modal
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, sData, shData] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchShopSubscriptions(),
        fetchShops(100)
      ]);
      setPlans(pData);
      setShopSubs(sData);
      setShops(shData);
      if (shData.length > 0) setSelectedShopId(shData[0].id);
      if (pData.length > 0) setSelectedPlanId(pData[0].id);
    } catch (err) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreatePlan = () => {
    setEditingPlan({
      name: '',
      price: 1499,
      duration_days: 30,
      pc_limit: 3,
      features: ['24/7 Priority Support', 'Unlimited Cloud Storage', 'Razorpay + Counter Cash'],
      services: ['Color Printing', 'Binding', 'Scanning'],
      is_active: true,
      is_popular: false
    });
    setFeaturesStr('24/7 Priority Support, Unlimited Cloud Storage, Razorpay + Counter Cash');
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFeaturesStr((plan.features || []).join(', '));
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan.name || editingPlan.price === undefined) {
      toast.error('Please enter valid plan name and price');
      return;
    }

    setSubmittingPlan(true);
    try {
      const feats = featuresStr.split(',').map((f) => f.trim()).filter(Boolean);
      await saveSubscriptionPlan({
        ...editingPlan,
        name: editingPlan.name,
        price: Number(editingPlan.price),
        features: feats
      });
      toast.success('Subscription plan saved successfully');
      setPlanModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save subscription plan');
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleTogglePlan = async (plan: SubscriptionPlan) => {
    try {
      await togglePlanStatus(plan.id, plan.is_active);
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: !p.is_active } : p))
      );
      toast.success(`Plan ${plan.name} status updated`);
    } catch (err) {
      toast.error('Failed to update plan status');
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedShopId || !selectedPlanId) return;
    const plan = plans.find((p) => p.id === selectedPlanId);
    if (!plan) return;

    setAssigning(true);
    try {
      await assignShopSubscription(selectedShopId, plan);
      toast.success(`Assigned ${plan.name} to shop successfully`);
      setAssignOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to assign subscription');
    } finally {
      setAssigning(false);
    }
  };

  const filteredShopSubs = shopSubs.filter((sub) => {
    const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(sub.shop_id);
    const matchesStatus = filters.status === 'all' || sub.status === filters.status;

    let matchesDate = true;
    if (filters.startDate) {
      const expDate = sub.expiry_date ? sub.expiry_date.split('T')[0] : '';
      matchesDate = matchesDate && expDate >= filters.startDate;
    }
    if (filters.endDate) {
      const startDate = sub.start_date ? sub.start_date.split('T')[0] : '';
      matchesDate = matchesDate && startDate <= filters.endDate;
    }

    return matchesShop && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            Subscription & Plan Management
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Create and edit recurring shop tier plans (pricing, duration, terminal limits, features) and track shop assignments.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAssignOpen(true)} variant="outline" className="h-9 text-xs">
            Assign to Shop
          </Button>
          <Button size="sm" onClick={handleOpenCreatePlan} className="h-9 gap-1.5 text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Plans Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`border shadow-sm relative flex flex-col ${
              plan.is_popular ? 'border-primary ring-1 ring-primary/30' : 'border-border'
            }`}
          >
            {plan.is_popular && (
              <Badge className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] px-2">
                Most Popular
              </Badge>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading font-bold">{plan.name}</CardTitle>
                <Badge variant={plan.is_active ? 'default' : 'secondary'} className={`text-[10px] ${plan.is_active ? 'bg-emerald-600' : ''}`}>
                  {plan.is_active ? 'Active' : 'Archived'}
                </Badge>
              </div>
              <CardDescription className="text-xs">{plan.description || `${plan.duration_days} Days Full Access`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-heading font-extrabold text-foreground">₹{plan.price.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">/ {plan.duration_days} days</span>
              </div>

              <div className="p-2.5 bg-muted/60 rounded-md text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Terminal PC Limit:</span>
                <Badge variant="outline" className="font-mono">{plan.pc_limit} PCs Included</Badge>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Included Features:</span>
                {(plan.features || []).map((feat, i) => (
                  <div key={i} className="flex items-center space-x-2 text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="p-4 pt-0 border-t border-border/50 mt-auto flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTogglePlan(plan)}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                {plan.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditPlan(plan)}
                className="text-xs h-8 gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Plan
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Database Filter Bar for Subscriptions */}
      <DatabaseFilterBar
        filters={filters}
        onFilterChange={setFilters}
        shops={shops}
        showShopFilter={true}
        showStatusFilter={true}
        statusOptions={[
          { label: 'All Statuses', value: 'all' },
          { label: 'Active Subscriptions', value: 'active' },
          { label: 'Expired / Invalid', value: 'expired' },
          { label: 'Cancelled / Inactive', value: 'inactive' }
        ]}
        showPaymentFilter={false}
      />

      {/* Active Shop Subscriptions Roster */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading font-bold">Shop Subscription Tracking & Expirations</CardTitle>
          <CardDescription className="text-xs">
            Showing {filteredShopSubs.length} of {shopSubs.length} shop subscriptions. Live overview of active shop plans, validity windows, and renewal statuses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Shop ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Current Plan</th>
                  <th className="py-3 px-4 whitespace-nowrap">Price</th>
                  <th className="py-3 px-4 whitespace-nowrap">PC Limit</th>
                  <th className="py-3 px-4 whitespace-nowrap">Start Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Expiry Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredShopSubs.length > 0 ? (
                  filteredShopSubs.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                        {sub.shop_id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-primary">
                        {sub.plan_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        ₹{sub.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sub.pc_limit} PCs
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-foreground font-medium">
                        {new Date(sub.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="default" className="text-[10px] bg-emerald-600">
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedShopId(sub.shop_id);
                            setAssignOpen(true);
                          }}
                          className="h-7 text-xs px-2 text-primary"
                        >
                          Renew / Upgrade
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No active shop subscriptions logged. Assign a plan above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PLAN CREATE / EDIT MODAL */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editingPlan.id ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define pricing, duration, PC terminal limits, and features.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Plan Name *</Label>
              <Input
                required
                placeholder="e.g. Professional Shop Tier"
                value={editingPlan.name || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Price (₹) *</Label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={editingPlan.price || 0}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Validity (Days) *</Label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={editingPlan.duration_days || 30}
                  onChange={(e) => setEditingPlan({ ...editingPlan, duration_days: parseInt(e.target.value) || 30 })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Terminal PC Limit (Concurrent PCs)</Label>
              <Input
                type="number"
                required
                min={1}
                max={20}
                value={editingPlan.pc_limit || 2}
                onChange={(e) => setEditingPlan({ ...editingPlan, pc_limit: parseInt(e.target.value) || 2 })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Features (Comma-separated)</Label>
              <Input
                placeholder="24/7 Support, Cloud Storage, Online Order Sync"
                value={featuresStr}
                onChange={(e) => setFeaturesStr(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPlanModalOpen(false)} disabled={submittingPlan} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submittingPlan} className="h-8 text-xs">
                {submittingPlan ? 'Saving...' : 'Save Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ASSIGN PLAN MODAL */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">Assign Plan to Shop</DialogTitle>
            <DialogDescription className="text-xs">
              Directly activate or upgrade a subscription plan for a shopkeeper.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Shop</Label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full h-8 text-xs border border-border rounded-md px-2 bg-background"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.terminal_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Select Subscription Plan</Label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full h-8 text-xs border border-border rounded-md px-2 bg-background"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.price} ({p.pc_limit} PCs)
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(false)} disabled={assigning} className="h-8 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAssignPlan} disabled={assigning} className="h-8 text-xs">
                {assigning ? 'Assigning...' : 'Assign Subscription'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
