import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  Store,
  CreditCard,
  Banknote,
  Cpu,
  Layers,
  Users,
  Inbox,
  Briefcase,
  LifeBuoy,
  FileText,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  Printer,
  ChevronRight,
  ShieldCheck,
  Palette,
  Megaphone,
  BookOpen,
  BellRing,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Operational Ledger', path: '/operational-ledger', icon: Activity },
  { name: 'Shops & Shopkeepers', path: '/shops', icon: Store },
  { name: 'Payment Methods', path: '/payment-methods', icon: CreditCard },
  { name: 'Settlements & Payouts', path: '/settlements', icon: Banknote },
  { name: 'PC Capacity Limits', path: '/pc-management', icon: Cpu },
  { name: 'Subscription Plans', path: '/subscriptions', icon: Layers },
  { name: 'Users & Memberships', path: '/users', icon: Users },
  { name: 'Advertisements', path: '/advertisements', icon: Megaphone },
  { name: 'Dynamic Pages & CMS', path: '/cms', icon: BookOpen },
  { name: 'Promotional Alerts', path: '/promotions', icon: BellRing },
  { name: 'Application Requests', path: '/requests', icon: Inbox },
  { name: 'Jobs & Careers', path: '/jobs', icon: Briefcase },
  { name: 'Help & Support', path: '/support', icon: LifeBuoy },
  { name: 'System Settings', path: '/settings', icon: Settings },
];

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, logout } = useAuth();
  const { themeColor, setThemeColor, themeMode, toggleThemeMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentNav = navItems.find((item) => location.pathname.startsWith(item.path)) || navItems[0];

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="space-y-1 px-2 py-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            }`}
          >
            <div className="flex items-center space-x-3 truncate">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </div>
            {item.badge && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${isActive ? 'bg-primary-foreground/20 text-primary-foreground border-none' : ''}`}>
                {item.badge}
              </Badge>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen fixed inset-y-0 left-0 z-40 border-r border-border bg-sidebar select-none">
        {/* Brand Header - Enlarged & Left-Aligned Logo per Section 4 */}
        <div className="h-20 shrink-0 flex items-center px-4 border-b border-sidebar-border justify-between">
          <div className="flex items-center">
            <img
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-awm3lxjnyu4g/app-evp0b1kqhrlt/20261011/printOn24.png"
              alt="PrintOn24"
              className="h-10 w-auto max-w-[170px] object-contain transition-transform hover:scale-105"
            />
          </div>
          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">v2.4</Badge>
        </div>

        {/* Scrollable Nav items - Scrolls Independently */}
        <div className="flex-1 overflow-y-auto py-2">
          {renderNavLinks()}
        </div>

        {/* Sidebar Footer with Theme & Admin info - Fixed at Bottom */}
        <div className="p-4 shrink-0 border-t border-sidebar-border bg-muted/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Palette:</span>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setThemeColor('white_red')}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  themeColor === 'white_red' ? 'border-foreground scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                title="White + Red Theme"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-rose-600" />
              </button>
              <button
                type="button"
                onClick={() => setThemeColor('white_blue')}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  themeColor === 'white_blue' ? 'border-foreground scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                title="White + Blue Theme"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2 truncate">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                SA
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold truncate leading-tight">{admin?.full_name || 'Super Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{admin?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
      {/* Main Column - Fixed Navbar & Only Main Page Content Scrolls */}
      <div className="flex-1 min-w-0 md:pl-64 flex flex-col h-screen overflow-hidden">
        {/* Fixed Top Header */}
        <header className="h-16 shrink-0 border-b border-border bg-background/95 backdrop-blur px-3 sm:px-4 md:px-6 flex items-center justify-between z-30">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Mobile Sheet Drawer Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 max-w-[85vw] flex flex-col bg-sidebar">
                <SheetHeader className="p-4 border-b border-sidebar-border relative">
                  <SheetTitle className="flex items-center justify-center">
                    <img
                      src="https://miaoda-conversation-file.s3cdn.medo.dev/user-awm3lxjnyu4g/app-evp0b1kqhrlt/20261011/printOn24.png"
                      alt="PrintOn24"
                      className="h-10 w-auto max-w-[160px] object-contain"
                    />
                  </SheetTitle>
                  <Badge variant="secondary" className="text-[10px] font-mono absolute top-3.5 right-3.5">v2.4</Badge>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                  {renderNavLinks(() => setMobileOpen(false))}
                </div>
                <div className="p-4 border-t border-sidebar-border bg-muted/30">
                  <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Page Title & Breadcrumb */}
            <div className="min-w-0">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">

                <span className="truncate">{currentNav.name}</span>
              </div>
              <h1 className="text-base md:text-lg font-heading font-bold text-foreground truncate leading-tight">
                {currentNav.name}
              </h1>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
            {/* Theme Palette Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 px-2.5">
                  <Palette className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline text-xs font-medium">
                    {themeColor === 'white_red' ? 'White + Red' : 'White + Blue'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Theme Palette</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setThemeColor('white_red')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-600" />
                    <span className="text-xs">White + Red</span>
                  </div>
                  {themeColor === 'white_red' && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setThemeColor('white_blue')}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-xs">White + Blue</span>
                  </div>
                  {themeColor === 'white_blue' && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Light / Dark Mode Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleThemeMode}
              className="h-9 w-9 rounded-md"
              title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
              <span className="sr-only">Toggle Dark Mode</span>
            </Button>

            {/* Admin Avatar & Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-2.5 space-x-2 hover:bg-muted">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-heading text-xs font-bold">
                    SA
                  </div>
                  <span className="hidden lg:inline text-xs font-semibold">{admin?.full_name || 'Super Admin'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{admin?.full_name || 'Super Admin'}</p>
                    <p className="text-xs text-muted-foreground">{admin?.email}</p>
                    <Badge variant="outline" className="w-fit text-[10px] mt-1 text-primary border-primary/30">
                      Master Administrator
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Account & Appearance</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area - ONLY this content area scrolls */}
        <main className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
