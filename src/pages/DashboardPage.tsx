import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOverallPlatformStats } from '@/services/api';
import type { OverallPlatformStats } from '@/types/types';
import {
  Store,
  Users,
  Printer,
  IndianRupee,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OverallPlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodDays, setPeriodDays] = useState<number>(14);
  const navigate = useNavigate();

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchOverallPlatformStats(periodDays);
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

    // Auto-refresh interval (polling every 30 seconds for real-time telemetry)
    const interval = setInterval(() => {
      fetchOverallPlatformStats(periodDays)
        .then((data) => setStats(data))
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [periodDays]);

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
      path: '/operational-ledger',
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
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
              Live Database Stream
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Real-time telemetry across shops, settlements, terminals, and print operations.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Select value={periodDays.toString()} onValueChange={(val) => setPeriodDays(Number(val))}>
            <SelectTrigger className="w-32 h-9 text-xs bg-card">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="14">Last 14 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Revenue & Payment Methods Breakdown - Main Chart Fix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Health & Dotted-Point Line Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Revenue and Payment Method Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Fluctuating daily telemetry across Razorpay Online, Counter Cash, and UPI (Last {periodDays} Days)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs self-start sm:self-auto">
                Live Dynamic
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 3 Metric Cards */}
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
                  Razorpay Payment Gateway
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pay on Counter (Cash)</span>
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xl font-heading font-bold mt-2 text-foreground">
                  ₹{(stats?.counterPaymentsAmount || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Direct In-Store Cash Collection
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>PayU / UPI Inflow</span>
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-xl font-heading font-bold mt-2 text-foreground">
                  ₹{(stats?.upiPaymentsAmount || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Instant UPI QR Transactions
                </p>
              </div>
            </div>

            {/* Dotted-Point Fluctuating Line Chart */}
            <div className="w-full pt-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                <span className="font-medium text-foreground">Daily Revenue Fluctuations by Payment Method</span>
                <span>Auto-refresh: 30s interval</span>
              </div>
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.dailyRevenueBreakdown || []}
                    margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `₹${val}`}
                      stroke="currentColor"
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value: any, name: string) => [`₹${Number(value).toLocaleString()}`, name]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Revenue"
                      stroke="#e11d48"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#e11d48', strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="counter"
                      name="Counter Cash"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#10b981', strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="online"
                      name="Razorpay Online"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="upi"
                      name="UPI / PayU"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#f59e0b', strokeWidth: 1 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
              onClick={() => navigate('/operational-ledger')}
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Operational Ledger & Orders</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>

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
              onClick={() => navigate('/operational-ledger')}
              className="text-xs h-8"
            >
              Full Operational Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
