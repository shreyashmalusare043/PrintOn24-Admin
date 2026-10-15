import React, { useEffect, useState } from 'react';
import {
  fetchAdvertisements,
  saveAdvertisement,
  deleteAdvertisement,
  toggleAdvertisementActive,
} from '@/services/api';
import type { Advertisement, AdPlacement } from '@/types/types';
import {
  Megaphone,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  CheckCircle2,
  XCircle,
  LayoutTemplate,
  UploadCloud,
  ArrowUpDown,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const AdvertisementsPage: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | AdPlacement>('all');

  // Add / Edit Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Partial<Advertisement>>({
    title: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    target_url: 'https://printon24.com/offers',
    placement: 'home_hero',
    is_active: true,
    display_order: 1
  });
  const [saving, setSaving] = useState(false);

  // Preview Modal
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);

  // Delete Dialog
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdvertisements();
      setAds(data);
    } catch (err: any) {
      toast.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingAd({
      title: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      target_url: 'https://printon24.com/offers',
      placement: activeTab === 'upload_page' ? 'upload_page' : 'home_hero',
      is_active: true,
      display_order: ads.length + 1
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ad: Advertisement) => {
    setEditingAd({ ...ad });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd.title?.trim() || !editingAd.image_url?.trim()) {
      toast.error('Please enter an ad title and valid image URL');
      return;
    }

    setSaving(true);
    try {
      await saveAdvertisement({
        id: editingAd.id,
        title: editingAd.title.trim(),
        description: editingAd.description || '',
        image_url: editingAd.image_url.trim(),
        target_url: editingAd.target_url || '',
        placement: (editingAd.placement as AdPlacement) || 'home_hero',
        is_active: editingAd.is_active !== undefined ? editingAd.is_active : true,
        display_order: Number(editingAd.display_order) || 1
      });

      toast.success(editingAd.id ? 'Advertisement updated successfully' : 'Advertisement launched successfully');
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save advertisement');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (ad: Advertisement) => {
    try {
      await toggleAdvertisementActive(ad.id, ad.is_active);
      setAds((prev) =>
        prev.map((item) => (item.id === ad.id ? { ...item, is_active: !item.is_active } : item))
      );
      toast.success(`Ad status changed to ${!ad.is_active ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      toast.error('Failed to change ad status');
    }
  };

  const handleDelete = async () => {
    if (!adToDelete) return;
    setDeleting(true);
    try {
      await deleteAdvertisement(adToDelete.id);
      setAds((prev) => prev.filter((item) => item.id !== adToDelete.id));
      toast.success('Advertisement deleted');
      setAdToDelete(null);
    } catch (err: any) {
      toast.error('Failed to delete advertisement');
    } finally {
      setDeleting(false);
    }
  };

  const filteredAds = ads.filter((ad) => {
    if (activeTab === 'all') return true;
    return ad.placement === activeTab;
  });

  const totalActive = ads.filter((a) => a.is_active).length;
  const heroAds = ads.filter((a) => a.placement === 'home_hero').length;
  const uploadAds = ads.filter((a) => a.placement === 'upload_page').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <Megaphone className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Advertisement & Banner Management
            </h2>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1.5">
            Manage promotional campaigns, banners, and partner sponsorships across User Panel Home Hero and Document Upload screens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="h-9 gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            Create Advertisement
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Ads Created</p>
              <h3 className="text-2xl font-bold font-heading text-foreground mt-0.5">{ads.length}</h3>
            </div>
            <Megaphone className="w-6 h-6 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Online</p>
              <h3 className="text-2xl font-bold font-heading text-emerald-600 mt-0.5">{totalActive}</h3>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-600/40" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Home Hero Placements</p>
              <h3 className="text-2xl font-bold font-heading text-primary mt-0.5">{heroAds}</h3>
            </div>
            <LayoutTemplate className="w-6 h-6 text-primary/40" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Upload Page Placements</p>
              <h3 className="text-2xl font-bold font-heading text-purple-600 mt-0.5">{uploadAds}</h3>
            </div>
            <UploadCloud className="w-6 h-6 text-purple-600/40" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs">
              All Placements ({ads.length})
            </TabsTrigger>
            <TabsTrigger value="home_hero" className="text-xs flex items-center gap-1.5">
              <LayoutTemplate className="w-3.5 h-3.5" />
              Home Hero Banner ({heroAds})
            </TabsTrigger>
            <TabsTrigger value="upload_page" className="text-xs flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5" />
              Upload Page Ad ({uploadAds})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Ads List Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading font-bold">Campaigns & Creative Library</CardTitle>
          <CardDescription className="text-xs">
            Showing {filteredAds.length} promotional items. Reorder, preview placement simulation, or toggle active broadcast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Banner Preview</th>
                  <th className="py-3 px-4 whitespace-nowrap">Ad Title & Description</th>
                  <th className="py-3 px-4 whitespace-nowrap">Placement</th>
                  <th className="py-3 px-4 whitespace-nowrap">Order</th>
                  <th className="py-3 px-4 whitespace-nowrap">Target Link</th>
                  <th className="py-3 px-4 whitespace-nowrap">Broadcast Status</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAds.length > 0 ? (
                  filteredAds.map((ad) => (
                    <tr key={ad.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="w-24 h-12 rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center relative group">
                          {ad.image_url ? (
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-foreground truncate">{ad.title}</div>
                        {ad.description && (
                          <div className="text-[11px] text-muted-foreground truncate">{ad.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            ad.placement === 'home_hero'
                              ? 'border-primary/40 text-primary bg-primary/5'
                              : 'border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-500/5'
                          }`}
                        >
                          {ad.placement === 'home_hero' ? 'User Home Hero' : 'Upload Page Banner'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                        #{ad.display_order}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap max-w-[160px] truncate">
                        {ad.target_url ? (
                          <a
                            href={ad.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
                          >
                            <span className="truncate max-w-[140px]">{ad.target_url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">No link</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ad.is_active}
                            onCheckedChange={() => handleToggle(ad)}
                            className="data-[state=checked]:bg-emerald-600 scale-90"
                          />
                          <span className={`text-[11px] font-medium ${ad.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {ad.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewAd(ad)}
                            title="Preview on Screen"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(ad)}
                            title="Edit Ad"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAdToDelete(ad)}
                            title="Delete Ad"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No advertisements found for this placement. Click "Create Advertisement" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editingAd.id ? 'Edit Advertisement Creative' : 'Create New Advertisement Banner'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure banner visuals, targeted destination placement, and click redirect behavior.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">
                  Campaign Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Student Print Festival - 20% Off All Spiral Bindings"
                  value={editingAd.title || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">Sub-heading / Promo Description</Label>
                <Textarea
                  placeholder="e.g. Upload your syllabus or project notes today at any campus PrintOn24 kiosk."
                  value={editingAd.description || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, description: e.target.value })}
                  className="text-xs min-h-[60px]"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">
                  Image Banner URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="https://..."
                  value={editingAd.image_url || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, image_url: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
                {editingAd.image_url && (
                  <div className="mt-2 w-full h-24 rounded-md overflow-hidden border border-border bg-muted">
                    <img
                      src={editingAd.image_url}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Placement Slot</Label>
                <Select
                  value={editingAd.placement || 'home_hero'}
                  onValueChange={(val: AdPlacement) => setEditingAd({ ...editingAd, placement: val })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_hero">User Panel Home Hero (Banner)</SelectItem>
                    <SelectItem value="upload_page">User Panel Upload Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Display Priority / Order</Label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={editingAd.display_order || 1}
                  onChange={(e) => setEditingAd({ ...editingAd, display_order: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">Click Target / Redirect URL</Label>
                <Input
                  placeholder="e.g. https://printon24.com/deals or /pricing"
                  value={editingAd.target_url || ''}
                  onChange={(e) => setEditingAd({ ...editingAd, target_url: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 md:col-span-2 pt-1">
                <Switch
                  id="ad-active"
                  checked={editingAd.is_active}
                  onCheckedChange={(checked) => setEditingAd({ ...editingAd, is_active: checked })}
                />
                <Label htmlFor="ad-active" className="text-xs font-medium cursor-pointer">
                  Publish and broadcast immediately on User Panel
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="text-xs h-8">
                {saving ? 'Saving...' : editingAd.id ? 'Update Advertisement' : 'Publish Advertisement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PREVIEW SIMULATION MODAL */}
      <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Live Simulation: {previewAd?.placement === 'home_hero' ? 'User Home Screen Banner' : 'Upload Page Placement'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Simulated display of active advertisement on mobile/desktop client layout.
            </DialogDescription>
          </DialogHeader>

          {previewAd && (
            <div className="p-4 bg-muted/60 rounded-xl border border-border space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-border shadow-md bg-card">
                <div className="aspect-[16/7] md:aspect-[21/8] w-full overflow-hidden relative">
                  <img
                    src={previewAd.image_url}
                    alt={previewAd.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                    <Badge className="w-fit bg-primary text-primary-foreground text-[10px] mb-1.5">
                      Sponsored / Announcement
                    </Badge>
                    <h4 className="text-base md:text-lg font-bold font-heading line-clamp-1">{previewAd.title}</h4>
                    {previewAd.description && (
                      <p className="text-xs text-white/80 line-clamp-2 mt-0.5">{previewAd.description}</p>
                    )}
                    {previewAd.target_url && (
                      <div className="mt-2.5">
                        <Button
                          size="sm"
                          onClick={() => toast.info(`Opening ${previewAd.target_url}`)}
                          className="h-7 text-xs bg-white text-black hover:bg-white/90 font-medium"
                        >
                          Check Promotion
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground flex justify-between items-center px-1">
                <span>Placement: <strong>{previewAd.placement}</strong></span>
                <span>Display Order: <strong>#{previewAd.display_order}</strong></span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION ALERT */}
      <AlertDialog open={!!adToDelete} onOpenChange={(open) => !open && setAdToDelete(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Remove Advertisement?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to remove "{adToDelete?.title}"? It will immediately stop appearing on the {adToDelete?.placement === 'home_hero' ? 'User Home Screen' : 'Upload Page'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs h-8 bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleting ? 'Removing...' : 'Delete Advertisement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
