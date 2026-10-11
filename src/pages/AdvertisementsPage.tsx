import React, { useEffect, useState } from 'react';
import {
  fetchHomeBanners,
  saveHomeBanner,
  deleteHomeBanner,
  toggleHomeBannerActive,
  fetchUploadPageAds,
  saveUploadPageAd,
  deleteUploadPageAd,
  toggleUploadPageAdActive
} from '@/services/api';
import type { HomeBanner, UploadPageAd } from '@/types/types';
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
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export const AdvertisementsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'upload'>('home');
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [uploadAds, setUploadAds] = useState<UploadPageAd[]>([]);
  const [loading, setLoading] = useState(true);

  // Home Banner Modal state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<HomeBanner>>({
    title: '',
    subtitle: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
    button_text: 'Print Online Now',
    button_link: '/upload',
    destination_url: '/upload',
    display_order: 1,
    is_active: true
  });
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<HomeBanner | null>(null);

  // Upload Page Ad Modal state
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Partial<UploadPageAd>>({
    title: '',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1200&q=80',
    destination_url: 'https://printon24.com/offers',
    display_order: 1,
    is_active: true
  });
  const [savingAd, setSavingAd] = useState(false);
  const [adToDelete, setAdToDelete] = useState<UploadPageAd | null>(null);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    description?: string | null;
    image_url: string;
    url?: string | null;
    placement: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hb, ua] = await Promise.all([
        fetchHomeBanners(),
        fetchUploadPageAds()
      ]);
      setHomeBanners(hb);
      setUploadAds(ua);
    } catch (err) {
      toast.error('Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // HOME BANNER HANDLERS
  const handleOpenCreateBanner = () => {
    setEditingBanner({
      title: '',
      subtitle: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      button_text: 'Print Online Now',
      button_link: '/upload',
      destination_url: '/upload',
      display_order: homeBanners.length + 1,
      is_active: true
    });
    setBannerModalOpen(true);
  };

  const handleOpenEditBanner = (b: HomeBanner) => {
    setEditingBanner({ ...b });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async () => {
    if (!editingBanner.title?.trim() || !editingBanner.image_url?.trim()) {
      toast.error('Please enter a banner title and image URL');
      return;
    }
    setSavingBanner(true);
    try {
      await saveHomeBanner({
        ...editingBanner,
        title: editingBanner.title.trim(),
        image_url: editingBanner.image_url.trim()
      } as any);
      toast.success('Home banner successfully synced to home_banners table!');
      setBannerModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to save home banner');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleDeleteBanner = async () => {
    if (!bannerToDelete) return;
    try {
      await deleteHomeBanner(bannerToDelete.id);
      toast.success('Banner removed from home_banners table');
      setBannerToDelete(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete banner');
    }
  };

  const handleToggleBannerActive = async (b: HomeBanner) => {
    try {
      await toggleHomeBannerActive(b.id, b.is_active);
      setHomeBanners((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, is_active: !b.is_active } : item))
      );
      toast.success(`Banner is now ${!b.is_active ? 'Active on User Home' : 'Disabled'}`);
    } catch (err) {
      toast.error('Failed to toggle banner status');
    }
  };

  // UPLOAD PAGE AD HANDLERS
  const handleOpenCreateAd = () => {
    setEditingAd({
      title: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1200&q=80',
      destination_url: 'https://printon24.com/offers',
      display_order: uploadAds.length + 1,
      is_active: true
    });
    setAdModalOpen(true);
  };

  const handleOpenEditAd = (ad: UploadPageAd) => {
    setEditingAd({ ...ad });
    setAdModalOpen(true);
  };

  const handleSaveAd = async () => {
    if (!editingAd.title?.trim() || !editingAd.image_url?.trim()) {
      toast.error('Please enter an ad title and image URL');
      return;
    }
    setSavingAd(true);
    try {
      await saveUploadPageAd({
        ...editingAd,
        title: editingAd.title.trim(),
        image_url: editingAd.image_url.trim()
      } as any);
      toast.success('Upload ad successfully synced to upload_page_ads table!');
      setAdModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to save upload ad');
    } finally {
      setSavingAd(false);
    }
  };

  const handleDeleteAd = async () => {
    if (!adToDelete) return;
    try {
      await deleteUploadPageAd(adToDelete.id);
      toast.success('Ad removed from upload_page_ads table');
      setAdToDelete(null);
      loadData();
    } catch (err) {
      toast.error('Failed to delete upload ad');
    }
  };

  const handleToggleAdActive = async (ad: UploadPageAd) => {
    try {
      await toggleUploadPageAdActive(ad.id, ad.is_active);
      setUploadAds((prev) =>
        prev.map((item) => (item.id === ad.id ? { ...item, is_active: !ad.is_active } : item))
      );
      toast.success(`Ad is now ${!ad.is_active ? 'Active on Document Upload Page' : 'Disabled'}`);
    } catch (err) {
      toast.error('Failed to toggle ad status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Advertisements & Banners Architecture
            </h2>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
              Live Tables: home_banners & upload_page_ads
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Super Admin changes sync directly to user-facing carousels and upload page slots. Deprecated advertisements table dropped.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {activeTab === 'home' ? (
            <Button size="sm" onClick={handleOpenCreateBanner} className="h-9 gap-1.5 text-xs shadow-sm">
              <Plus className="w-4 h-4" /> Add Home Banner
            </Button>
          ) : (
            <Button size="sm" onClick={handleOpenCreateAd} className="h-9 gap-1.5 text-xs shadow-sm">
              <Plus className="w-4 h-4" /> Add Upload Page Ad
            </Button>
          )}
        </div>
      </div>

      {/* 2 Distinct Sections / Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="home" className="gap-2 text-xs">
            <LayoutTemplate className="w-3.5 h-3.5" />
            1. Home Page Banners ({homeBanners.length})
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 text-xs">
            <UploadCloud className="w-3.5 h-3.5" />
            2. Upload Page Ads ({uploadAds.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: HOME PAGE BANNERS */}
        <TabsContent value="home" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-heading font-bold">
                    Home Page Hero Banners ({homeBanners.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Target Table: <code className="text-primary font-mono font-semibold">home_banners</code> (Rendered in User Portal Homepage Carousel)
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleOpenCreateBanner} className="h-8 text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" /> New Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Order</th>
                      <th className="py-3 px-4 whitespace-nowrap">Creative Preview</th>
                      <th className="py-3 px-4 whitespace-nowrap">Title & Subtitle</th>
                      <th className="py-3 px-4 whitespace-nowrap">CTA Button & Target</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          Loading banners from home_banners table...
                        </td>
                      </tr>
                    ) : homeBanners.length > 0 ? (
                      homeBanners.map((b) => (
                        <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-foreground">
                            #{b.display_order || 1}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="w-20 h-11 rounded-md overflow-hidden bg-muted border border-border relative group">
                              <img
                                src={b.image_url}
                                alt={b.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80';
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground line-clamp-1">{b.title}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{b.subtitle || b.description || 'No subtitle provided'}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {b.button_text || 'Print Now'}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {b.button_link || b.destination_url || '/upload'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={b.is_active}
                                onCheckedChange={() => handleToggleBannerActive(b)}
                              />
                              <span className={`text-[11px] ${b.is_active ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                                {b.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewItem({
                                  title: b.title,
                                  description: b.subtitle || b.description,
                                  image_url: b.image_url,
                                  url: b.button_link || b.destination_url,
                                  placement: 'Home Page Hero Carousel'
                                })}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Preview Creative"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditBanner(b)}
                                className="h-7 w-7 p-0 text-primary hover:text-primary"
                                title="Edit Banner"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBannerToDelete(b)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Delete Banner"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No banners found in home_banners table. Click "New Banner" to create your first hero carousel slide.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: UPLOAD PAGE ADS */}
        <TabsContent value="upload" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-heading font-bold">
                    Document Upload Page Promotional Slots ({uploadAds.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Target Table: <code className="text-primary font-mono font-semibold">upload_page_ads</code> (Rendered during user document upload journey)
                  </CardDescription>
                </div>
                <Button size="sm" onClick={handleOpenCreateAd} className="h-8 text-xs gap-1">
                  <Plus className="w-3.5 h-3.5" /> New Upload Ad
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Order</th>
                      <th className="py-3 px-4 whitespace-nowrap">Creative Preview</th>
                      <th className="py-3 px-4 whitespace-nowrap">Title & Description</th>
                      <th className="py-3 px-4 whitespace-nowrap">Redirect Destination URL</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          Loading ads from upload_page_ads table...
                        </td>
                      </tr>
                    ) : uploadAds.length > 0 ? (
                      uploadAds.map((ad) => (
                        <tr key={ad.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-foreground">
                            #{ad.display_order || 1}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="w-20 h-11 rounded-md overflow-hidden bg-muted border border-border relative group">
                              <img
                                src={ad.image_url}
                                alt={ad.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as any).src = 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=300&q=80';
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground line-clamp-1">{ad.title}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{ad.description || 'Promotional banner during file upload'}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-muted-foreground max-w-[160px] truncate">
                            {ad.destination_url || 'https://printon24.com/offers'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={ad.is_active}
                                onCheckedChange={() => handleToggleAdActive(ad)}
                              />
                              <span className={`text-[11px] ${ad.is_active ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                                {ad.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewItem({
                                  title: ad.title,
                                  description: ad.description,
                                  image_url: ad.image_url,
                                  url: ad.destination_url,
                                  placement: 'Upload Page Promotional Slot'
                                })}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                title="Preview Creative"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditAd(ad)}
                                className="h-7 w-7 p-0 text-primary hover:text-primary"
                                title="Edit Ad"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAdToDelete(ad)}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Delete Ad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No ads found in upload_page_ads table. Click "New Upload Ad" to add one.
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

      {/* MODAL: ADD / EDIT HOME BANNER */}
      <Dialog open={bannerModalOpen} onOpenChange={setBannerModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              {editingBanner.id ? 'Edit Home Page Banner' : 'Create Home Page Banner'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saves directly into the shared <code className="font-mono text-primary font-semibold">home_banners</code> table for the user portal hero slider.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Banner Title *</Label>
              <Input
                placeholder="e.g. Flash Sale: 50% Off Bulk Document Printing"
                value={editingBanner.title}
                onChange={(e) => setEditingBanner((p) => ({ ...p, title: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Subtitle / Promo Tagline</Label>
              <Input
                placeholder="e.g. High speed laser printing across all campus hubs"
                value={editingBanner.subtitle || ''}
                onChange={(e) => setEditingBanner((p) => ({ ...p, subtitle: e.target.value, description: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Image URL (High-res 16:9 banner) *</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={editingBanner.image_url}
                onChange={(e) => setEditingBanner((p) => ({ ...p, image_url: e.target.value }))}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">CTA Button Text</Label>
                <Input
                  placeholder="e.g. Print Online Now"
                  value={editingBanner.button_text || ''}
                  onChange={(e) => setEditingBanner((p) => ({ ...p, button_text: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Destination URL / Route</Label>
                <Input
                  placeholder="/upload or https://..."
                  value={editingBanner.destination_url || ''}
                  onChange={(e) => setEditingBanner((p) => ({ ...p, destination_url: e.target.value, button_link: e.target.value }))}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Display Sequence Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingBanner.display_order}
                  onChange={(e) => setEditingBanner((p) => ({ ...p, display_order: Number(e.target.value) }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex flex-col justify-end pb-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Publish Immediately</span>
                  <Switch
                    checked={editingBanner.is_active}
                    onCheckedChange={(checked) => setEditingBanner((p) => ({ ...p, is_active: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBannerModalOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveBanner} disabled={savingBanner} className="h-8 text-xs font-semibold">
              {savingBanner ? 'Saving...' : 'Save to home_banners'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ADD / EDIT UPLOAD PAGE AD */}
      <Dialog open={adModalOpen} onOpenChange={setAdModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" />
              {editingAd.id ? 'Edit Upload Page Ad' : 'Create Upload Page Ad'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Saves directly into the shared <code className="font-mono text-primary font-semibold">upload_page_ads</code> table.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ad Campaign Title *</Label>
              <Input
                placeholder="e.g. Try Spiral Binding & Premium Bond Paper"
                value={editingAd.title}
                onChange={(e) => setEditingAd((p) => ({ ...p, title: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ad Description / Promo Details</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Upgrade your thesis documents with glossy finish binding."
                value={editingAd.description || ''}
                onChange={(e) => setEditingAd((p) => ({ ...p, description: e.target.value }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Image URL *</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={editingAd.image_url}
                onChange={(e) => setEditingAd((p) => ({ ...p, image_url: e.target.value }))}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Click Destination URL</Label>
              <Input
                placeholder="https://printon24.com/offers"
                value={editingAd.destination_url || ''}
                onChange={(e) => setEditingAd((p) => ({ ...p, destination_url: e.target.value }))}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Display Sequence Order</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingAd.display_order}
                  onChange={(e) => setEditingAd((p) => ({ ...p, display_order: Number(e.target.value) }))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex flex-col justify-end pb-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Active on Upload Page</span>
                  <Switch
                    checked={editingAd.is_active}
                    onCheckedChange={(checked) => setEditingAd((p) => ({ ...p, is_active: checked }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAdModalOpen(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveAd} disabled={savingAd} className="h-8 text-xs font-semibold">
              {savingAd ? 'Saving...' : 'Save to upload_page_ads'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PREVIEW MODAL */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Creative Preview: {previewItem?.placement}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={previewItem.image_url} alt={previewItem.title} className="w-full h-44 object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{previewItem.title}</h4>
                {previewItem.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{previewItem.description}</p>
                )}
                {previewItem.url && (
                  <p className="text-[11px] font-mono text-primary mt-1 truncate">Link: {previewItem.url}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setPreviewItem(null)} className="h-8 text-xs">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: DELETE BANNER */}
      <AlertDialog open={!!bannerToDelete} onOpenChange={(open) => !open && setBannerToDelete(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Remove Banner from home_banners?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete <strong>{bannerToDelete?.title}</strong>? It will immediately disappear from the user home carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBanner} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Banner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT DIALOG: DELETE UPLOAD AD */}
      <AlertDialog open={!!adToDelete} onOpenChange={(open) => !open && setAdToDelete(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Remove Ad from upload_page_ads?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Are you sure you want to delete <strong>{adToDelete?.title}</strong>? It will immediately disappear from the document upload page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAd} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Ad
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
