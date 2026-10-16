import React, { useEffect, useState } from 'react';
import {
  fetchShops,
  createShopWithCredentials,
  toggleShopStatus,
  setShopStatus,
  updateShopPaymentConfig,
  updateShopDetails,
  fetchShopkeeperForShop,
  fetchShopQRs,
  type CreateShopPayload
} from '@/services/api';
import type { PrintShop, ShopkeeperAccount, ShopQR, PaymentMethodConfig, ShopStatus } from '@/types/types';
import {
  Store,
  Plus,
  Search,
  Filter,
  QrCode,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Banknote,
  Copy,
  Check,
  ExternalLink,
  Power,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRCodeDataUrl from '@/components/ui/qrcodedataurl';
import { DatabaseFilterBar, FilterState } from '@/components/common/DatabaseFilterBar';
import { SecurityPasswordModal } from '@/components/security/SecurityPasswordModal';
import { toast } from 'sonner';
import { Eye, EyeOff, Download } from 'lucide-react';

export const ShopsPage: React.FC = () => {
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Comprehensive Database Filters
  const [filters, setFilters] = useState<FilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    shopIds: [],
    status: 'all',
    paymentType: 'all'
  });

  // Register Modal state
  const [registerOpen, setRegisterOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    shop: PrintShop;
    account: ShopkeeperAccount;
    qr: ShopQR;
  } | null>(null);

  // Shop Detail Modal
  const [selectedShop, setSelectedShop] = useState<PrintShop | null>(null);
  const [shopkeeper, setShopkeeper] = useState<ShopkeeperAccount | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Credential view protection with 6-digit Security Password
  const [credentialsUnlocked, setCredentialsUnlocked] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Dedicated View QR Modal
  const [qrModalShop, setQrModalShop] = useState<PrintShop | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateShopPayload>({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    city: 'Pune',
    terminalCode: '',
    paymentMethodConfig: 'both',
    pcLimit: 2,
    bankAccountNo: '',
    bankIfsc: '',
    upiId: '',
    membershipEnabled: true,
    membershipPrice: 99
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await fetchShops(100);
      setShops(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load printing shops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handleOpenRegister = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormData({
      name: '',
      ownerName: '',
      phone: '+91 ',
      email: '',
      password: `sk_${Math.random().toString(36).substring(2, 8)}`,
      address: '',
      city: 'Pune',
      terminalCode: `PUNE-SH-${randomSuffix}`,
      paymentMethodConfig: 'both',
      pcLimit: 2,
      bankAccountNo: '',
      bankIfsc: 'HDFC0001234',
      upiId: '',
      membershipEnabled: true,
      membershipPrice: 99
    });
    setCreatedResult(null);
    setRegisterOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.address) {
      toast.error('Please fill in all mandatory shop details');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createShopWithCredentials(formData);
      setCreatedResult(result);
      toast.success(`Shop "${result.shop.name}" and credentials registered successfully!`);
      loadShops();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create shop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetStatus = async (shop: PrintShop, newStatus: ShopStatus) => {
    try {
      await setShopStatus(shop.id, newStatus);
      setShops((prev) =>
        prev.map((s) => (s.id === shop.id ? { ...s, status: newStatus, is_open: newStatus === 'active' } : s))
      );
      if (selectedShop?.id === shop.id) {
        setSelectedShop((prev) => (prev ? { ...prev, status: newStatus, is_open: newStatus === 'active' } : null));
      }
      toast.success(`Shop "${shop.name}" marked as ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      toast.error('Failed to change shop status: ' + (err.message || 'Error'));
    }
  };

  const handleToggleStatus = async (shop: PrintShop) => {
    try {
      const nextStatus: ShopStatus = shop.status === 'active' ? 'inactive' : 'active';
      await handleSetStatus(shop, nextStatus);
    } catch (err: any) {
      toast.error('Failed to change shop status');
    }
  };

  const handleChangePaymentConfig = async (shopId: string, config: PaymentMethodConfig) => {
    try {
      await updateShopPaymentConfig(shopId, config);
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, payment_method_config: config } : s))
      );
      if (selectedShop?.id === shopId) {
        setSelectedShop((prev) => (prev ? { ...prev, payment_method_config: config } : null));
      }
      toast.success(`Payment method updated to ${config.toUpperCase()}`);
    } catch (err: any) {
      toast.error('Failed to update payment method');
    }
  };

  const handleUpdatePcLimit = async (shopId: string, limit: number) => {
    try {
      await updateShopDetails(shopId, { pc_limit: limit });
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, pc_limit: limit } : s))
      );
      if (selectedShop?.id === shopId) {
        setSelectedShop((prev) => (prev ? { ...prev, pc_limit: limit } : null));
      }
      toast.success(`Terminal PC limit updated to ${limit} PCs`);
    } catch (err: any) {
      toast.error('Failed to update PC limit: ' + (err.message || 'Error'));
    }
  };

  const handleViewShop = async (shop: PrintShop) => {
    setSelectedShop(shop);
    setCredentialsUnlocked(false);
    setDetailLoading(true);
    try {
      const sk = await fetchShopkeeperForShop(shop.id);
      setShopkeeper(sk);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenQrModal = (shop: PrintShop) => {
    setQrModalShop(shop);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredShops = shops.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.owner_name && s.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.terminal_code && s.terminal_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filters.status === 'all' || s.status === filters.status;
    const matchesPayment = filters.paymentType === 'all' || s.payment_method_config === filters.paymentType;
    const matchesShop = filters.shopIds.length === 0 || filters.shopIds.includes(s.id);

    let matchesDate = true;
    if (filters.startDate) {
      const createdDate = s.created_at ? s.created_at.split('T')[0] : '';
      matchesDate = matchesDate && createdDate >= filters.startDate;
    }
    if (filters.endDate) {
      const createdDate = s.created_at ? s.created_at.split('T')[0] : '';
      matchesDate = matchesDate && createdDate <= filters.endDate;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesShop && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header & Create CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Shop & Shopkeeper Management
            </h2>
            <Badge variant="outline" className="text-xs">
              {shops.length} Connected
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Provision new printing shops, assign shopkeeper credentials, generate QR codes, and enforce shop isolation.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Button variant="outline" size="sm" onClick={loadShops} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenRegister} className="h-9 gap-1.5 text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            Register New Shop
          </Button>
        </div>
      </div>

      {/* Comprehensive Filter & Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            placeholder="Search shops by name, owner, terminal code, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>
        <DatabaseFilterBar
          filters={filters}
          onFilterChange={setFilters}
          shops={shops}
          showShopFilter={true}
          showStatusFilter={true}
          statusOptions={[
            { label: 'All Statuses', value: 'all' },
            { label: 'Active Shops', value: 'active' },
            { label: 'Inactive Shops', value: 'inactive' },
            { label: 'Disabled Shops', value: 'disabled' }
          ]}
          showPaymentFilter={true}
          paymentOptions={[
            { label: 'All Payment Modes', value: 'all' },
            { label: 'Both (Counter & Razorpay)', value: 'both' },
            { label: 'Razorpay Online Only', value: 'razorpay' },
            { label: 'Counter Only', value: 'counter' }
          ]}
        />
      </div>

      {/* Shop Directory Grid / Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading font-bold">Registered Printing Shops</CardTitle>
            <span className="text-xs text-muted-foreground">Showing {filteredShops.length} of {shops.length} shops</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Shop Name & Terminal</th>
                  <th className="py-3 px-4 whitespace-nowrap">Owner / Contact</th>
                  <th className="py-3 px-4 whitespace-nowrap">City / Address</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Payment Config</th>
                  <th className="py-3 px-4 whitespace-nowrap">PC Limit</th>
                  <th className="py-3 px-4 whitespace-nowrap">QR Code</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredShops.length > 0 ? (
                  filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground flex items-center space-x-1.5">
                          <span>{shop.name}</span>
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">{shop.terminal_code}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{shop.owner_name || 'Assigned Operator'}</div>
                        <div className="text-[10px] text-muted-foreground">{shop.phone}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-foreground">{shop.city || 'Pune'}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-xs">{shop.address}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Select
                          value={shop.status}
                          onValueChange={(val: ShopStatus) => handleSetStatus(shop, val)}
                        >
                          <SelectTrigger className={`h-6 w-24 text-[10px] font-semibold border ${
                            shop.status === 'active'
                              ? 'bg-emerald-600/10 text-emerald-600 border-emerald-500/30'
                              : shop.status === 'disabled'
                              ? 'bg-destructive/10 text-destructive border-destructive/30'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          }`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium ${
                            shop.payment_method_config === 'both'
                              ? 'border-purple-500/30 text-purple-700 dark:text-purple-300'
                              : shop.payment_method_config === 'razorpay'
                              ? 'border-blue-500/30 text-blue-700 dark:text-blue-300'
                              : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {shop.payment_method_config === 'both'
                            ? 'Both (Online & Cash)'
                            : shop.payment_method_config === 'razorpay'
                            ? 'Razorpay Only'
                            : 'Counter Only'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">
                        {shop.pc_limit || 2} PCs
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenQrModal(shop)}
                          className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary/80"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          View QR
                        </Button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewShop(shop)}
                          className="h-7 text-xs px-2"
                        >
                          Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(shop)}
                          className={`h-7 w-7 p-0 ${shop.status === 'active' ? 'text-destructive' : 'text-emerald-600'}`}
                          title={shop.status === 'active' ? 'Deactivate Shop' : 'Activate Shop'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No printing shops matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* REGISTER SHOP MODAL */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold">
              {createdResult ? 'Shop Provisioned Successfully' : 'Register New Printing Shop'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {createdResult
                ? 'Shop and initial shopkeeper credentials have been generated and stored.'
                : 'Create printing shop record and generate compatible shopkeeper login credentials and QR.'}
            </DialogDescription>
          </DialogHeader>

          {createdResult ? (
            /* SUCCESS VIEW WITH CREDENTIALS AND QR CODE */
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Success:</strong> Unique shop QR and shopkeeper account are active!
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Credentials Card */}
                <Card className="border border-border">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-primary" /> Shopkeeper Login Credentials
                    </CardTitle>
                    <CardDescription className="text-[11px]">
                      Share these credentials with the shopkeeper for their panel:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2.5">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Login Email:</span>
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md text-xs font-mono font-medium mt-0.5">
                        <span className="truncate">{createdResult.account.email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(createdResult.account.email, 'email')}
                        >
                          {copiedKey === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Password:</span>
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md text-xs font-mono font-medium mt-0.5">
                        <span className="truncate">{createdResult.account.password_hash}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(createdResult.account.password_hash, 'pwd')}
                        >
                          {copiedKey === 'pwd' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Terminal Code:</span>
                      <div className="p-2 bg-muted rounded-md text-xs font-mono font-bold text-primary mt-0.5">
                        {createdResult.shop.terminal_code}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code Card */}
                <Card className="border border-border flex flex-col items-center justify-center p-4 text-center">
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200">
                    <QRCodeDataUrl
                      text={createdResult.qr.qr_data || `PRINTON24:SHOP:${createdResult.shop.terminal_code}`}
                      className="w-36 h-36"
                    />
                  </div>
                  <p className="font-heading font-bold text-xs mt-2">{createdResult.shop.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{createdResult.qr.qr_data}</p>
                  <Badge variant="outline" className="text-[10px] mt-1.5 bg-primary/10 text-primary border-primary/20">
                    Ready for Counter Standee
                  </Badge>
                </Card>
              </div>

              <DialogFooter>
                <Button onClick={() => setRegisterOpen(false)} className="w-full text-xs">
                  Done & Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* FORM VIEW */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Shop Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Campus Copy Center"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Owner / Operator Name *</Label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Shopkeeper Email (Login) *</Label>
                  <Input
                    type="email"
                    required
                    placeholder="shopkeeper@printon24.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Initial Password *</Label>
                  <Input
                    required
                    placeholder="Password for shopkeeper"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Contact Phone *</Label>
                  <Input
                    required
                    placeholder="+91 98220 12345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City *</Label>
                  <Input
                    required
                    placeholder="Pune"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Physical Shop Address *</Label>
                  <Input
                    required
                    placeholder="e.g. Shop 4, Opp University Main Gate, Pune"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Terminal Code *</Label>
                  <Input
                    required
                    placeholder="e.g. PUNE-UN-01"
                    value={formData.terminalCode}
                    onChange={(e) => setFormData({ ...formData, terminalCode: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Allowed Payment Modes *</Label>
                  <Select
                    value={formData.paymentMethodConfig}
                    onValueChange={(val: any) => setFormData({ ...formData, paymentMethodConfig: val })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both (Razorpay Online + Counter)</SelectItem>
                      <SelectItem value="razorpay">Razorpay Online Only</SelectItem>
                      <SelectItem value="counter">Pay on Counter Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Default PC Limit (Terminals)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.pcLimit}
                    onChange={(e) => setFormData({ ...formData, pcLimit: parseInt(e.target.value) || 2 })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bank Account Number (For Settlements)</Label>
                  <Input
                    placeholder="Account number"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Bank IFSC Code</Label>
                  <Input
                    placeholder="HDFC0001234"
                    value={formData.bankIfsc}
                    onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Shop UPI ID</Label>
                  <Input
                    placeholder="shopname@okhdfcbank"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegisterOpen(false)}
                  disabled={submitting}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="text-xs h-9 gap-1.5">
                  {submitting ? 'Generating Shop & QR...' : 'Create Shop & Generate QR'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SHOP DETAILS & CONFIGURATION MODAL */}
      <Dialog open={!!selectedShop} onOpenChange={(open) => !open && setSelectedShop(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          {selectedShop && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="font-heading text-lg font-bold flex items-center space-x-2">
                    <span>{selectedShop.name}</span>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedShop.status}
                        onValueChange={(val: ShopStatus) => handleSetStatus(selectedShop, val)}
                      >
                        <SelectTrigger className={`h-7 w-28 text-[11px] font-semibold border ${
                          selectedShop.status === 'active'
                            ? 'bg-emerald-600/10 text-emerald-600 border-emerald-500/30'
                            : selectedShop.status === 'disabled'
                            ? 'bg-destructive/10 text-destructive border-destructive/30'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs font-mono">
                  Terminal ID: {selectedShop.terminal_code} • City: {selectedShop.city || 'Pune'}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid grid-cols-2 h-8 text-xs">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="payment" className="text-xs">Payment & Limits</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Owner / Manager</span>
                      <p className="font-semibold text-foreground mt-0.5">{selectedShop.owner_name || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Phone</span>
                      <p className="font-semibold text-foreground mt-0.5">{selectedShop.phone || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg col-span-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Address</span>
                      <p className="text-foreground mt-0.5">{selectedShop.address}</p>
                    </div>
                  </div>

                  {/* Shopkeeper Account Credentials (Protected by 6-digit Security Password) */}
                  <div className="p-3 bg-card border border-border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-primary" /> Shopkeeper Login Credentials
                      </span>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {credentialsUnlocked ? 'Credentials Revealed' : 'Protected by PIN'}
                      </Badge>
                    </div>
                    {detailLoading ? (
                      <p className="text-xs text-muted-foreground">Loading credentials...</p>
                    ) : shopkeeper ? (
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="p-2 bg-muted/60 rounded">
                          <span className="text-[10px] text-muted-foreground block">Email (Login ID)</span>
                          <span className="font-medium truncate block">{shopkeeper.email}</span>
                        </div>
                        <div className="p-2 bg-muted/60 rounded flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-muted-foreground block">Password Access</span>
                            <span className="font-medium truncate block tracking-wider">
                              {credentialsUnlocked
                                ? (shopkeeper.password_hash || '••••••••')
                                : '••••••••••••'}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (credentialsUnlocked) {
                                setCredentialsUnlocked(false);
                              } else {
                                setSecurityModalOpen(true);
                              }
                            }}
                            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                            title={credentialsUnlocked ? 'Hide credentials' : 'Enter 6-digit PIN to reveal'}
                          >
                            {credentialsUnlocked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-primary" />}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Default account registered with shop email.</p>
                    )}
                    {!credentialsUnlocked && (
                      <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-primary" />
                        Click the eye icon to verify 6-digit Credential View password configured in System Settings.
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* PAYMENT & LIMITS TAB */}
                <TabsContent value="payment" className="space-y-4 pt-3">
                  <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
                    <Label className="text-xs font-semibold">Payment Method Configuration</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Controls whether users can pay online via Razorpay, pay on counter with cash, or choose either.
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <Button
                        type="button"
                        variant={selectedShop.payment_method_config === 'counter' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleChangePaymentConfig(selectedShop.id, 'counter')}
                        className="text-xs h-9"
                      >
                        Counter Only
                      </Button>
                      <Button
                        type="button"
                        variant={selectedShop.payment_method_config === 'razorpay' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleChangePaymentConfig(selectedShop.id, 'razorpay')}
                        className="text-xs h-9"
                      >
                        Razorpay Only
                      </Button>
                      <Button
                        type="button"
                        variant={selectedShop.payment_method_config === 'both' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleChangePaymentConfig(selectedShop.id, 'both')}
                        className="text-xs h-9"
                      >
                        Both Allowed
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Terminal PC Limit</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{selectedShop.pc_limit || 2} PCs</Badge>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          defaultValue={selectedShop.pc_limit || 2}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) handleUpdatePcLimit(selectedShop.id, val);
                          }}
                          className="h-8 text-xs font-mono w-20"
                        />
                        <span className="text-[11px] text-muted-foreground">Max concurrent PCs</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/40 rounded-lg">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Settlement Bank</span>
                      <p className="font-semibold text-foreground mt-0.5">{selectedShop.bank_ifsc || 'HDFC Bank'} ({selectedShop.bank_account_no ? `••••${selectedShop.bank_account_no.slice(-4)}` : 'Not Set'})</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setSelectedShop(null)} className="text-xs h-8">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DEDICATED VIEW QR CODE MODAL (SHARP, CENTERED ALIGNMENT) */}
      <Dialog open={!!qrModalShop} onOpenChange={(open) => !open && setQrModalShop(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          {qrModalShop && (
            <div className="space-y-4 text-center">
              <DialogHeader>
                <DialogTitle className="font-heading text-lg font-bold text-center">
                  Shop Terminal QR Code
                </DialogTitle>
                <DialogDescription className="text-xs text-center">
                  Sharp scannable QR code for <strong>{qrModalShop.name}</strong>
                </DialogDescription>
              </DialogHeader>

              {/* Centered QR Display Inside Properly Sized Container */}
              <div className="w-64 h-64 mx-auto flex items-center justify-center p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                <QRCodeDataUrl
                  text={qrModalShop.qr_code_data || `PRINTON24:SHOP:${qrModalShop.terminal_code}`}
                  width={220}
                  className="w-56 h-56 block mx-auto"
                />
              </div>

              <div className="space-y-1">
                <p className="font-heading font-bold text-base text-foreground">{qrModalShop.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{qrModalShop.terminal_code}</p>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Ready for Counter Standee & Direct Order
                </Badge>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`https://printon24.com/shop/${qrModalShop.terminal_code}`, 'qr_url')}
                  className="text-xs h-9 gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Store URL
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.print();
                  }}
                  className="text-xs h-9 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Print / Save Standee
                </Button>
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setQrModalShop(null)} className="w-full text-xs h-8">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6-DIGIT CREDENTIAL VIEW VERIFICATION MODAL */}
      <SecurityPasswordModal
        type="credential_view"
        isOpen={securityModalOpen}
        title="Unlock Shopkeeper Credentials"
        description="Enter the 6-digit Credential View password configured in System Settings to reveal login details."
        onClose={() => setSecurityModalOpen(false)}
        onSuccess={() => {
          setCredentialsUnlocked(true);
          setSecurityModalOpen(false);
        }}
      />
    </div>
  );
};
