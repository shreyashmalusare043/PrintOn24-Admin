import React, { useEffect, useState } from 'react';
import { fetchUserProfiles, fetchUserMemberships, fetchShops, fetchPrintOrders } from '@/services/api';
import type { UserProfile, UserMembership, PrintShop, PrintOrder } from '@/types/types';
import { Users, Crown, Search, Filter, RefreshCw, ShoppingBag, Phone, Mail, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Shop filter for VIP memberships
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [searchUser, setSearchUser] = useState('');

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, mData, sData, oData] = await Promise.all([
        fetchUserProfiles(100),
        fetchUserMemberships(),
        fetchShops(100),
        fetchPrintOrders()
      ]);
      setUsers(uData);
      setMemberships(mData);
      setShops(sData);
      setOrders(oData);
    } catch (err) {
      toast.error('Failed to load users and VIP memberships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMemberships = memberships.filter((m) => {
    const matchesShop = selectedShopFilter === 'all' || m.shop_id === selectedShopFilter;
    const matchesSearch =
      m.user_name.toLowerCase().includes(searchUser.toLowerCase()) ||
      m.card_number.toLowerCase().includes(searchUser.toLowerCase()) ||
      (m.user_phone && m.user_phone.includes(searchUser));
    return matchesShop && matchesSearch;
  });

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.phone.includes(searchUser)
    );
  });

  // User orders
  const userOrders = selectedUser ? orders.filter((o) => o.user_id === selectedUser.id) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            User & VIP Membership Management
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Super Admin directory of registered printing clients and strict shop-wise VIP membership relations.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="memberships" className="w-full">
        <TabsList className="grid grid-cols-2 h-9 text-xs max-w-md">
          <TabsTrigger value="memberships" className="text-xs">
            Shop-Wise VIP Members ({memberships.length})
          </TabsTrigger>
          <TabsTrigger value="all-users" className="text-xs">
            Registered Users Directory ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* SHOP-WISE VIP MEMBERSHIPS TAB */}
        <TabsContent value="memberships" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-heading font-bold flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" /> Shop-Wise VIP Membership Directory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Filter VIP subscription cards mapped to specific printing shops
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={selectedShopFilter} onValueChange={setSelectedShopFilter}>
                    <SelectTrigger className="w-56 h-8 text-xs">
                      <SelectValue placeholder="Filter by Shop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Printing Shops</SelectItem>
                      {shops.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Search member name or card..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="w-48 h-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Member Name</th>
                      <th className="py-3 px-4 whitespace-nowrap">Associated Shop</th>
                      <th className="py-3 px-4 whitespace-nowrap">Membership Card</th>
                      <th className="py-3 px-4 whitespace-nowrap">Tier</th>
                      <th className="py-3 px-4 whitespace-nowrap">Discount %</th>
                      <th className="py-3 px-4 whitespace-nowrap">Valid Until</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredMemberships.length > 0 ? (
                      filteredMemberships.map((m) => {
                        const shopObj = shops.find((s) => s.id === m.shop_id);
                        const rawShopName = shopObj ? shopObj.name : m.shop_id;
                        return (
                          <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                              <div>{m.user_name}</div>
                              <div className="text-[10px] text-muted-foreground">{m.user_phone || 'Phone verified'}</div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                              <span
                                title={rawShopName}
                                className="inline-block max-w-[180px] sm:max-w-[240px] truncate align-middle font-medium"
                              >
                                {rawShopName}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-primary">
                              {m.card_number}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                                {m.tier}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                              {m.discount_percentage}% OFF
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                              {new Date(m.valid_until).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <Badge variant="default" className="text-[10px] bg-emerald-600">
                                {m.is_active ? 'Active' : 'Expired'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No VIP members found for this shop selection.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGISTERED USERS TAB */}
        <TabsContent value="all-users" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading font-bold">End-User Client Directory</CardTitle>
                <span className="text-xs text-muted-foreground">Total: {users.length} clients</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Name</th>
                      <th className="py-3 px-4 whitespace-nowrap">Email</th>
                      <th className="py-3 px-4 whitespace-nowrap">Phone</th>
                      <th className="py-3 px-4 whitespace-nowrap">Address</th>
                      <th className="py-3 px-4 whitespace-nowrap">Verified</th>
                      <th className="py-3 px-4 whitespace-nowrap">Registered</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                          {user.name} {user.surname || ''}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {user.phone}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground max-w-xs truncate">
                          {user.address || 'Pune'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                            Verified
                          </Badge>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            className="h-7 text-xs px-2"
                          >
                            Orders & Prints
                          </Button>
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

      {/* USER ORDER ACTIVITY MODAL */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              Print Orders: {selectedUser?.name} {selectedUser?.surname || ''}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Contact: {selectedUser?.phone} • {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <h4 className="font-semibold text-foreground">Order & Print History:</h4>
            {userOrders.length > 0 ? (
              <div className="space-y-2">
                {userOrders.map((order) => (
                  <div key={order.id} className="p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{order.document_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {order.shop_name} • Token #{order.token_number} • {order.total_pages} pages ({order.config_copies} copies)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{order.total_price}</p>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {order.payment_mode}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No recent print orders logged for this client.</p>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)} className="h-8 text-xs">
                Close
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
