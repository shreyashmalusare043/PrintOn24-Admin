import React, { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { fetchCMSContent, saveCMSContent, deleteCMSContent } from '@/services/api';
import type { CMSContent } from '@/types/types';
import {
  BellRing,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Users,
  Store,
  Layers,
  Inbox
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  order_id?: string | null;
  created_at: string;
}

export const PromotionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'broadcasts' | 'inbox_logs'>('broadcasts');
  const [loading, setLoading] = useState(true);

  // Broadcasts (cms_content)
  const [broadcasts, setBroadcasts] = useState<CMSContent[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<string>('all');

  // In-App Notifications (notifications table)
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<CMSContent> & { dispatchInbox?: boolean }>({
    title: '',
    subtitle: '',
    content: '',
    category: 'announcement',
    target_audience: 'all',
    badge_text: 'PROMO',
    is_active: true,
    display_order: 1,
    dispatchInbox: true
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: cmsData, error: cmsError } = await supabase
        .from('cms_content')
        .select('*')
        .in('category', ['announcement', 'notice', 'promotional_alert'])
        .order('display_order', { ascending: true });

      if (cmsError) throw cmsError;
      setBroadcasts(Array.isArray(cmsData) ? (cmsData as CMSContent[]) : []);

      // Load recent in-app notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (notifError) throw notifError;
      setNotifications(Array.isArray(notifData) ? (notifData as InAppNotification[]) : []);
    } catch (err: any) {
      toast.error('Failed to load promotional alerts: ' + (err.message || 'Database error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem({
      title: '',
      subtitle: '',
      content: '',
      category: 'promotional_alert',
      target_audience: 'all',
      badge_text: 'Limited Offer',
      is_active: true,
      display_order: (broadcasts.length || 0) + 1,
      dispatchInbox: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CMSContent) => {
    setEditingItem({
      ...item,
      dispatchInbox: false
    });
    setModalOpen(true);
  };

  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.title?.trim() || !editingItem.content?.trim()) {
      toast.error('Please enter a title and announcement content');
      return;
    }

    setSaving(true);
    try {
      const id = editingItem.id || `promo_${Date.now()}`;
      const now = new Date().toISOString();

      // 1. Save to cms_content table
      const { error: cmsError } = await supabase
        .from('cms_content')
        .upsert({
          id,
          title: editingItem.title.trim(),
          subtitle: editingItem.subtitle?.trim() || null,
          content: editingItem.content.trim(),
          category: editingItem.category || 'promotional_alert',
          target_audience: editingItem.target_audience || 'all',
          badge_text: editingItem.badge_text?.trim() || null,
          is_active: editingItem.is_active !== undefined ? editingItem.is_active : true,
          display_order: Number(editingItem.display_order) || 1,
          updated_at: now
        });

      if (cmsError) throw cmsError;

      // 2. If dispatchInbox is true, send record to notifications table
      if (editingItem.dispatchInbox) {
        // Broadcast to general users / shopkeepers
        await supabase.from('notifications').insert({
          id: `notif_${Date.now()}`,
          user_id: editingItem.target_audience === 'shopkeeper' ? 'all_shopkeepers' : 'all_users',
          title: editingItem.title.trim(),
          message: editingItem.content.trim(),
          type: 'promo',
          is_read: false,
          created_at: now
        });
      }

      toast.success('Promotional alert successfully written to database!');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to save alert: ' + (err.message || 'Database error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: CMSContent) => {
    const nextActive = !item.is_active;
    try {
      const { error } = await supabase
        .from('cms_content')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', item.id);

      if (error) throw error;
      setBroadcasts((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, is_active: nextActive } : b))
      );
      toast.success(`Alert "${item.title}" is now ${nextActive ? 'Published (visible on panels)' : 'Unpublished (hidden)'}`);
    } catch (err: any) {
      toast.error('Failed to update alert status in database');
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    try {
      const { error } = await supabase.from('cms_content').delete().eq('id', id);
      if (error) throw error;
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      toast.success('Alert permanently removed from cms_content table');
    } catch (err: any) {
      toast.error('Failed to delete alert');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification removed from database');
    } catch (err: any) {
      toast.error('Failed to delete notification');
    }
  };

  const filteredBroadcasts = broadcasts.filter((b) => {
    if (audienceFilter === 'all') return true;
    return b.target_audience === audienceFilter || b.target_audience === 'all';
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" /> Promotional Alerts & Notices
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Author and broadcast promotional campaigns, system maintenance notices, and discounts directly to User and Shopkeeper panels via <code>cms_content</code> and <code>notifications</code>.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="h-9 gap-1.5 text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid grid-cols-2 h-9 text-xs max-w-md bg-muted/60">
          <TabsTrigger value="broadcasts" className="text-xs gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Broadcast Alerts ({broadcasts.length})
          </TabsTrigger>
          <TabsTrigger value="inbox_logs" className="text-xs gap-1.5">
            <Inbox className="w-3.5 h-3.5" /> In-App Notification Logs ({notifications.length})
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: BROADCASTS (cms_content) */}
        {/* ======================================================== */}
        <TabsContent value="broadcasts" className="space-y-4 pt-3">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border border-border">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-muted-foreground">Target Audience:</span>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="user">Users (Students)</SelectItem>
                  <SelectItem value="shopkeeper">Shopkeepers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredBroadcasts.length} active announcements
            </div>
          </div>

          {/* Broadcast Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBroadcasts.map((item) => (
              <Card key={item.id} className="border shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {item.badge_text && (
                          <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                            {item.badge_text}
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-[10px] capitalize"
                        >
                          {item.target_audience === 'all' ? 'All Platforms' : item.target_audience}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-heading font-bold">{item.title}</CardTitle>
                    </div>
                    <Badge variant={item.is_active ? 'default' : 'secondary'} className={`text-[10px] shrink-0 ${item.is_active ? 'bg-emerald-600' : ''}`}>
                      {item.is_active ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  {item.subtitle && (
                    <CardDescription className="text-xs pt-1">{item.subtitle}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground flex-1">
                  <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                </CardContent>
                <div className="p-4 pt-0 border-t border-border flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Order: #{item.display_order} • <code>{item.category}</code>
                  </span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(item)}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    >
                      {item.is_active ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="h-7 text-xs px-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBroadcast(item.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: IN-APP NOTIFICATIONS (notifications table) */}
        {/* ======================================================== */}
        <TabsContent value="inbox_logs" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                <Inbox className="w-4 h-4 text-primary" /> Live Dispatched Notifications Table
              </CardTitle>
              <CardDescription className="text-xs">
                Direct view of rows in <code>notifications</code> table dispatched to users and shopkeepers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Target Recipient</th>
                      <th className="py-3 px-4 whitespace-nowrap">Title</th>
                      <th className="py-3 px-4 whitespace-nowrap">Message</th>
                      <th className="py-3 px-4 whitespace-nowrap">Type</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap">Sent Timestamp</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <tr key={n.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-foreground">
                            {n.user_id}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                            {n.title}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                            {n.message}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {n.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant={n.is_read ? 'secondary' : 'default'} className="text-[10px]">
                              {n.is_read ? 'Read' : 'Delivered'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                            {new Date(n.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNotification(n.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No notifications found in database table.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold">
              {editingItem.id ? 'Edit Promotional Alert' : 'Create Promotional Alert / Notice'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saves to <code>cms_content</code> with optional instant dispatch to <code>notifications</code> table.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAlert} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Title *</Label>
                <Input
                  value={editingItem.title || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g. 50% Off First 10 Xerox Prints!"
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Badge / Ribbon Text</Label>
                <Input
                  value={editingItem.badge_text || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, badge_text: e.target.value })}
                  placeholder="e.g. LIMITED TIME, URGENT"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Audience</Label>
                <Select
                  value={editingItem.target_audience || 'all'}
                  onValueChange={(val) => setEditingItem({ ...editingItem, target_audience: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All (Users & Shopkeepers)</SelectItem>
                    <SelectItem value="user">Mobile Users Only</SelectItem>
                    <SelectItem value="shopkeeper">Shopkeepers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <Select
                  value={editingItem.category || 'promotional_alert'}
                  onValueChange={(val) => setEditingItem({ ...editingItem, category: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional_alert">Promotional Alert</SelectItem>
                    <SelectItem value="announcement">Platform Announcement</SelectItem>
                    <SelectItem value="notice">System Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Subtitle / Summary</Label>
              <Input
                value={editingItem.subtitle || ''}
                onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                placeholder="Optional short tagline"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Detailed Message Content *</Label>
              <Textarea
                value={editingItem.content || ''}
                onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                rows={4}
                placeholder="Full promo terms, discount codes, or announcement message..."
                className="text-xs"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border border-border">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingItem.is_active !== false}
                  onCheckedChange={(c) => setEditingItem({ ...editingItem, is_active: c })}
                  id="promo-active"
                />
                <Label htmlFor="promo-active" className="text-xs cursor-pointer">
                  Published & Active
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={Boolean(editingItem.dispatchInbox)}
                  onCheckedChange={(c) => setEditingItem({ ...editingItem, dispatchInbox: c })}
                  id="promo-inbox"
                />
                <Label htmlFor="promo-inbox" className="text-xs cursor-pointer text-primary font-medium">
                  Dispatch In-App Inbox Alert
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="h-9 text-xs gap-1.5 shadow-sm">
                <Send className="w-3.5 h-3.5" /> Save to Database
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
