import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOverallPlatformStats } from '@/services/api';
import type { OverallPlatformStats } from '@/types/types';
import {
  Store,
  Users,
  Printer,
  ShoppingBag,
  IndianRupee,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OverallPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchOverallPlatformStats();
      setStats(data);
      if (isManual) toast.success('Analytics metrics refreshed from database');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load platform analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Aggregating real-time PrintOn24 platform data...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Connected Shops',
      value: stats?.totalConnectedShops || 0,
      subValue: `${stats?.activeShops || 0} Active • ${stats?.inactiveShops || 0} Inactive`,
      icon: Store,
      path: '/shops',
      accent: 'text-primary'
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers || 0,
      subValue: `${stats?.totalVIPUsers || 0} VIP Members`,
      icon: Users,
      path: '/users',
      accent: 'text-blue-600'
    },
    {
      title: 'Total Prints Delivered',
      value: (stats?.totalPrints || 0).toLocaleString(),
      subValue: `${stats?.totalOrders || 0} Processed Orders`,
      icon: Printer,
      path: '/users',
      accent: 'text-emerald-600'
    },
    {
      title: 'Gross Platform Revenue',
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      subValue: `Online: ₹${(stats?.onlinePaymentsAmount || 0).toLocaleString()} • Counter: ₹${(stats?.counterPaymentsAmount || 0).toLocaleString()}`,
      icon: IndianRupee,
      path: '/settlements',
      accent: 'text-amber-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              PrintOn24 Executive Overview
            </h2>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
              Live Production
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Real-time telemetry across shops, settlements, terminals, and print operations.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-9 gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/shops')}
            className="h-9 gap-1.5 text-xs shadow-sm"
          >
            <Store className="w-4 h-4" />
            Manage Shops
          </Button>
        </div>
      </div>

      {/* 2-Day Settlement Cycle Alert Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200 text-xs md:text-sm gap-3">
        <div className="flex items-center space-x-2.5">
          <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>2-Day Settlement Cycle Active:</strong> Super Admin has{' '}
            <strong className="underline underline-offset-2">
              {stats?.pendingSettlementsCount || 0} shops
            </strong>{' '}
            awaiting payout disbursement totaling{' '}
            <strong>₹{(stats?.pendingSettlementsAmount || 0).toLocaleString()}</strong>.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/settlements')}
          className="h-8 text-xs border-amber-500/30 hover:bg-amber-500/20 shrink-0 self-end md:self-auto"
        >
          Review Settlements <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={i}
              className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm"
              onClick={() => navigate(stat.path)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div className={`p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors ${stat.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-heading font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {stat.subValue}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue & Payment Modes Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Health */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-heading font-bold">Revenue & Payment Methods Breakdown</CardTitle>
                <CardDescription className="text-xs">Database-driven distribution of Razorpay online versus counter cash</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Real-Time
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Online via Razorpay</span>
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-xl font-heading font-bold mt-2 text-foreground">
                  ₹{(stats?.onlinePaymentsAmount || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Company Razorpay Gateway
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pay on Counter (Cash/UPI)</span>
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-heading font-bold mt-2 text-foreground">
                  ₹{(stats?.counterPaymentsAmount || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Direct In-Store Collection
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Completed Payouts</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-xl font-heading font-bold mt-2 text-foreground">
                  ₹{(stats?.completedSettlementsAmount || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Disbursed to Shopkeepers
                </p>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Payment Mode Distribution</span>
                <span>
                  Online:{' '}
                  {stats?.totalRevenue
                    ? Math.round(((stats.onlinePaymentsAmount || 0) / stats.totalRevenue) * 100)
                    : 50}
                  % • Counter:{' '}
                  {stats?.totalRevenue
                    ? Math.round(((stats.counterPaymentsAmount || 0) / stats.totalRevenue) * 100)
                    : 50}
                  %
                </span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{
                    width: `${
                      stats?.totalRevenue
                        ? ((stats.onlinePaymentsAmount || 0) / stats.totalRevenue) * 100
                        : 50
                    }%`
                  }}
                  title="Online Payments"
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{
                    width: `${
                      stats?.totalRevenue
                        ? ((stats.counterPaymentsAmount || 0) / stats.totalRevenue) * 100
                        : 50
                    }%`
                  }}
                  title="Counter Payments"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Operational Health Quick Links */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading font-bold">Platform Controls</CardTitle>
            <CardDescription className="text-xs">Direct navigation to core management modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Button
              variant="outline"
              className="w-full justify-between h-11 text-xs"
              onClick={() => navigate('/payment-methods')}
            >
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Shop Payment Method Config</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-11 text-xs"
              onClick={() => navigate('/pc-management')}
            >
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>PC Capacity Limit Requests</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-11 text-xs"
              onClick={() => navigate('/subscriptions')}
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Subscription Plans & Tiers</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-11 text-xs"
              onClick={() => navigate('/users')}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Shop-Wise VIP Memberships</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Shop-wise Performance & Revenue Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-heading font-bold">Shop-Wise Operational Ledger</CardTitle>
              <CardDescription className="text-xs">
                Real-time breakdown of volume, online/counter collection, and 2-day pending payouts per shop
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/shops')}
              className="text-xs h-8"
            >
              Full Shop Directory <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Shop & Terminal</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">PC Limit</th>
                  <th className="py-3 px-4 whitespace-nowrap">Orders</th>
                  <th className="py-3 px-4 whitespace-nowrap">Online (Razorpay)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Counter Cash</th>
                  <th className="py-3 px-4 whitespace-nowrap">Total Revenue</th>
                  <th className="py-3 px-4 whitespace-nowrap">Pending Payout</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats?.shopRevenueList && stats.shopRevenueList.length > 0 ? (
                  stats.shopRevenueList.map((shop) => (
                    <tr key={shop.shopId} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{shop.shopName}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{shop.terminalCode}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={shop.status === 'active' ? 'default' : 'secondary'}
                          className={`text-[10px] capitalize ${shop.status === 'active' ? 'bg-emerald-600' : ''}`}
                        >
                          {shop.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">
                        {shop.pcLimit} Terminals
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">
                        {shop.totalOrders}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-blue-600 font-semibold">
                        ₹{shop.onlineRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-emerald-600 font-semibold">
                        ₹{shop.counterRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-foreground">
                        ₹{shop.totalRevenue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {shop.pendingPayout > 0 ? (
                          <span className="text-amber-600 font-semibold">₹{shop.pendingPayout.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/shops?id=${shop.shopId}`)}
                          className="h-7 text-xs px-2 text-primary hover:text-primary"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-muted-foreground">
                      No connected shops found. Register your first shop to start tracking live telemetry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
