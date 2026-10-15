import React, { useEffect, useState } from 'react';
import {
  fetchAboutUsSections,
  saveAboutUsSection,
  fetchPlatformPolicies,
  savePlatformPolicy,
  fetchPlatformTerms,
  savePlatformTerms,
  fetchCMSContent,
  saveCMSContent,
  deleteCMSContent
} from '@/services/api';
import type { PlatformPolicy, PlatformTerms, CMSContent } from '@/types/types';
import {
  FileText,
  ShieldCheck,
  Scale,
  RefreshCw,
  Save,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Megaphone,
  Sparkles,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const CMSPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'about' | 'privacy' | 'terms' | 'announcements'>('about');
  const [loading, setLoading] = useState(true);

  // 1. About Us (cms_content)
  const [aboutSections, setAboutSections] = useState<CMSContent[]>([]);
  const [selectedAboutId, setSelectedAboutId] = useState<string>('about_hero');
  const [editingAbout, setEditingAbout] = useState<{
    id: string;
    title: string;
    subtitle: string;
    content: string;
    is_active: boolean;
  }>({
    id: 'about_hero',
    title: '',
    subtitle: '',
    content: '',
    is_active: true
  });
  const [aboutMode, setAboutMode] = useState<'edit' | 'preview'>('edit');
  const [savingAbout, setSavingAbout] = useState(false);

  // 2. Privacy Policies (platform_policies)
  const [policies, setPolicies] = useState<PlatformPolicy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<PlatformPolicy>({
    id: 'pol_01',
    title: 'printOn24 Customer Privacy & Data Protection Policy',
    content: '',
    version: 'v2.6',
    published_at: null,
    is_active: true
  });
  const [policyMode, setPolicyMode] = useState<'edit' | 'preview'>('edit');
  const [savingPolicy, setSavingPolicy] = useState(false);

  // 3. Terms & Conditions (platform_terms)
  const [terms, setTerms] = useState<PlatformTerms[]>([]);
  const [editingTerms, setEditingTerms] = useState<PlatformTerms>({
    id: 'trm_01',
    title: 'printOn24 Platform Terms of Service & Printing Agreement',
    content: '',
    version: 'v2.6',
    published_at: null,
    is_active: true
  });
  const [termsMode, setTermsMode] = useState<'edit' | 'preview'>('edit');
  const [savingTerms, setSavingTerms] = useState(false);

  // 4. Announcements & Notices (cms_content)
  const [announcements, setAnnouncements] = useState<CMSContent[]>([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<CMSContent>>({
    title: '',
    subtitle: '',
    content: '',
    category: 'announcement',
    target_audience: 'all',
    badge_text: '',
    is_active: true
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aboutData, policyData, termsData, cmsData] = await Promise.all([
        fetchAboutUsSections(),
        fetchPlatformPolicies(),
        fetchPlatformTerms(),
        fetchCMSContent('announcement')
      ]);

      // Set About Us
      setAboutSections(aboutData);
      if (aboutData.length > 0) {
        const current = aboutData.find((a) => a.id === selectedAboutId) || aboutData[0];
        setSelectedAboutId(current.id);
        setEditingAbout({
          id: current.id,
          title: current.title,
          subtitle: current.subtitle || '',
          content: current.content || '',
          is_active: current.is_active
        });
      }

      // Set Privacy Policies
      setPolicies(policyData);
      if (policyData.length > 0) {
        setEditingPolicy(policyData[0]);
      }

      // Set Terms
      setTerms(termsData);
      if (termsData.length > 0) {
        setEditingTerms(termsData[0]);
      }

      // Set Announcements
      setAnnouncements(cmsData);
    } catch (err: any) {
      toast.error('Failed to load CMS content: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When about section selection changes
  const handleSelectAboutSection = (id: string) => {
    setSelectedAboutId(id);
    const item = aboutSections.find((a) => a.id === id);
    if (item) {
      setEditingAbout({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle || '',
        content: item.content || '',
        is_active: item.is_active
      });
    }
  };

  // Save About Section
  const handleSaveAbout = async (publishStatus?: boolean) => {
    if (!editingAbout.title.trim()) {
      toast.error('Please enter a section title');
      return;
    }
    setSavingAbout(true);
    const updatedStatus = publishStatus !== undefined ? publishStatus : editingAbout.is_active;
    try {
      await saveAboutUsSection({
        id: editingAbout.id,
        title: editingAbout.title.trim(),
        subtitle: editingAbout.subtitle.trim() || undefined,
        content: editingAbout.content,
        is_active: updatedStatus
      });
      setEditingAbout((prev) => ({ ...prev, is_active: updatedStatus }));
      setAboutSections((prev) =>
        prev.map((a) =>
          a.id === editingAbout.id
            ? { ...a, title: editingAbout.title, subtitle: editingAbout.subtitle, content: editingAbout.content, is_active: updatedStatus }
            : a
        )
      );
      toast.success(
        publishStatus === true
          ? 'Section published to User Panel About page (cms_content)!'
          : publishStatus === false
          ? 'Section unpublished from User Panel'
          : 'About section changes saved to cms_content table!'
      );
    } catch (err: any) {
      toast.error('Failed to save to cms_content: ' + (err.message || 'Database error'));
    } finally {
      setSavingAbout(false);
    }
  };

  // Save Privacy Policy
  const handleSavePolicy = async (publishStatus?: boolean) => {
    if (!editingPolicy.title.trim() || !editingPolicy.content.trim()) {
      toast.error('Please provide a policy title and content');
      return;
    }
    setSavingPolicy(true);
    const updatedStatus = publishStatus !== undefined ? publishStatus : editingPolicy.is_active;
    const now = new Date().toISOString();
    try {
      await savePlatformPolicy({
        ...editingPolicy,
        title: editingPolicy.title.trim(),
        is_active: updatedStatus,
        published_at: updatedStatus ? now : editingPolicy.published_at
      });
      setEditingPolicy((prev) => ({
        ...prev,
        is_active: updatedStatus,
        published_at: updatedStatus ? now : prev.published_at
      }));
      toast.success(
        publishStatus === true
          ? 'Privacy Policy successfully published to User Panel (platform_policies)!'
          : publishStatus === false
          ? 'Privacy Policy unpublished from User Panel'
          : 'Privacy Policy saved to platform_policies table!'
      );
    } catch (err: any) {
      toast.error('Failed to save to platform_policies: ' + (err.message || 'Database error'));
    } finally {
      setSavingPolicy(false);
    }
  };

  // Save Terms and Conditions
  const handleSaveTerms = async (publishStatus?: boolean) => {
    if (!editingTerms.title.trim() || !editingTerms.content.trim()) {
      toast.error('Please provide terms title and content');
      return;
    }
    setSavingTerms(true);
    const updatedStatus = publishStatus !== undefined ? publishStatus : editingTerms.is_active;
    const now = new Date().toISOString();
    try {
      await savePlatformTerms({
        ...editingTerms,
        title: editingTerms.title.trim(),
        is_active: updatedStatus,
        published_at: updatedStatus ? now : editingTerms.published_at
      });
      setEditingTerms((prev) => ({
        ...prev,
        is_active: updatedStatus,
        published_at: updatedStatus ? now : prev.published_at
      }));
      toast.success(
        publishStatus === true
          ? 'Terms & Conditions successfully published to User Panel (platform_terms)!'
          : publishStatus === false
          ? 'Terms & Conditions unpublished from User Panel'
          : 'Terms & Conditions saved to platform_terms table!'
      );
    } catch (err: any) {
      toast.error('Failed to save to platform_terms: ' + (err.message || 'Database error'));
    } finally {
      setSavingTerms(false);
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async () => {
    if (!editingAnnouncement.title?.trim() || !editingAnnouncement.content?.trim()) {
      toast.error('Please enter announcement title and content');
      return;
    }
    setSavingAnnouncement(true);
    try {
      await saveCMSContent({
        ...editingAnnouncement,
        title: editingAnnouncement.title.trim(),
        content: editingAnnouncement.content.trim(),
        category: 'announcement'
      } as any);
      toast.success('Announcement synced to cms_content table!');
      setAnnouncementModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Failed to save announcement');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteCMSContent(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Announcement removed from cms_content table');
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            Dynamic Pages & CMS Management
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Author and publish content directly to production database tables: About Us (<code>cms_content</code>), Privacy Policies (<code>platform_policies</code>), and Terms & Conditions (<code>platform_terms</code>).
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 h-10 text-xs w-full max-w-2xl bg-muted/60 p-1">
          <TabsTrigger value="about" className="text-xs gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> About PrintOn24
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Privacy Policies
          </TabsTrigger>
          <TabsTrigger value="terms" className="text-xs gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-600" /> Terms & Conditions
          </TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-amber-600" /> System Notices
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* 1. ABOUT PRINTON24 (cms_content) */}
        {/* ======================================================== */}
        <TabsContent value="about" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Section Selector Sidebar */}
            <Card className="lg:col-span-1 shadow-sm h-fit">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-heading font-bold">About Us Sections</CardTitle>
                <CardDescription className="text-xs">
                  Connected to <code>cms_content</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {aboutSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSelectAboutSection(sec.id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedAboutId === sec.id
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'hover:bg-muted/70 text-foreground'
                    }`}
                  >
                    <span className="truncate pr-2">{sec.title || sec.id}</span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 shrink-0 ${
                        selectedAboutId === sec.id
                          ? 'border-primary-foreground/30 text-primary-foreground'
                          : sec.is_active
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-muted-foreground text-muted-foreground'
                      }`}
                    >
                      {sec.is_active ? 'Active' : 'Draft'}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card className="lg:col-span-3 shadow-sm flex flex-col">
              <CardHeader className="p-4 md:p-6 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-heading font-bold">
                      {editingAbout.title || 'About Section Editor'}
                    </CardTitle>
                    <Badge variant={editingAbout.is_active ? 'default' : 'secondary'} className={`text-[10px] ${editingAbout.is_active ? 'bg-emerald-600' : ''}`}>
                      {editingAbout.is_active ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs pt-0.5">
                    ID: <code>{editingAbout.id}</code> • Table: <code>cms_content</code>
                  </CardDescription>
                </div>

                {/* Edit / Preview Tabs & Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex border border-border rounded-lg overflow-hidden p-0.5 bg-muted/40">
                    <Button
                      variant={aboutMode === 'edit' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAboutMode('edit')}
                      className="h-7 text-xs px-2.5"
                    >
                      Edit
                    </Button>
                    <Button
                      variant={aboutMode === 'preview' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setAboutMode('preview')}
                      className="h-7 text-xs px-2.5"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 md:p-6 space-y-4 flex-1">
                {aboutMode === 'edit' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Section Title</Label>
                        <Input
                          value={editingAbout.title}
                          onChange={(e) => setEditingAbout({ ...editingAbout, title: e.target.value })}
                          placeholder="e.g. Digitizing Campus Printing Across India"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Subtitle / Tagline</Label>
                        <Input
                          value={editingAbout.subtitle}
                          onChange={(e) => setEditingAbout({ ...editingAbout, subtitle: e.target.value })}
                          placeholder="Optional subtitle or badge"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Section Content</Label>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {editingAbout.content.length} characters
                        </span>
                      </div>
                      <Textarea
                        value={editingAbout.content}
                        onChange={(e) => setEditingAbout({ ...editingAbout, content: e.target.value })}
                        rows={14}
                        placeholder="Enter the section content or narrative description..."
                        className="text-xs font-mono leading-relaxed resize-y min-h-[300px] bg-background"
                      />
                    </div>
                  </div>
                ) : (
                  /* Preview Mode */
                  <div className="p-6 rounded-xl border border-border bg-muted/20 space-y-4 min-h-[350px]">
                    <div className="border-b border-border pb-3">
                      <Badge variant="outline" className="text-[10px] mb-2">
                        {editingAbout.subtitle || 'About PrintOn24'}
                      </Badge>
                      <h3 className="text-lg md:text-xl font-heading font-bold text-foreground">
                        {editingAbout.title}
                      </h3>
                    </div>
                    <div className="text-xs md:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed space-y-2">
                      {editingAbout.content || (
                        <span className="text-muted-foreground italic">No content written yet.</span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Bottom Actions */}
              <div className="p-4 md:p-6 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-card/60">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingAbout.is_active}
                    onCheckedChange={(c) => setEditingAbout({ ...editingAbout, is_active: c })}
                    id="about-active"
                  />
                  <Label htmlFor="about-active" className="text-xs text-muted-foreground cursor-pointer">
                    Display on User Panel
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveAbout()}
                    disabled={savingAbout}
                    className="h-9 text-xs gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </Button>
                  {editingAbout.is_active ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleSaveAbout(false)}
                      disabled={savingAbout}
                      className="h-9 text-xs"
                    >
                      Unpublish
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSaveAbout(true)}
                      disabled={savingAbout}
                      className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Publish to User Panel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* 2. PRIVACY POLICIES (platform_policies) */}
        {/* ======================================================== */}
        <TabsContent value="privacy" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {editingPolicy.title}
                  </CardTitle>
                  <Badge variant={editingPolicy.is_active ? 'default' : 'secondary'} className={`text-[10px] ${editingPolicy.is_active ? 'bg-emerald-600' : ''}`}>
                    {editingPolicy.is_active ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {editingPolicy.version}
                  </Badge>
                </div>
                <CardDescription className="text-xs pt-0.5">
                  Connected directly to <code>platform_policies</code> • Last Published:{' '}
                  {editingPolicy.published_at
                    ? new Date(editingPolicy.published_at).toLocaleString()
                    : 'Not published yet'}
                </CardDescription>
              </div>

              {/* Edit / Preview Tabs */}
              <div className="flex items-center space-x-2 shrink-0">
                <div className="flex border border-border rounded-lg overflow-hidden p-0.5 bg-muted/40">
                  <Button
                    variant={policyMode === 'edit' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPolicyMode('edit')}
                    className="h-7 text-xs px-2.5"
                  >
                    Edit Content
                  </Button>
                  <Button
                    variant={policyMode === 'preview' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPolicyMode('preview')}
                    className="h-7 text-xs px-2.5"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Live Preview
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-6 space-y-4">
              {policyMode === 'edit' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Document Title</Label>
                      <Input
                        value={editingPolicy.title}
                        onChange={(e) => setEditingPolicy({ ...editingPolicy, title: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Version</Label>
                      <Input
                        value={editingPolicy.version}
                        onChange={(e) => setEditingPolicy({ ...editingPolicy, version: e.target.value })}
                        placeholder="v2.6"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Privacy Policy Content</Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {editingPolicy.content.length} characters • Clean structured text
                      </span>
                    </div>
                    <Textarea
                      value={editingPolicy.content}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, content: e.target.value })}
                      rows={18}
                      placeholder="Enter policy sections and clauses..."
                      className="text-xs font-mono leading-relaxed resize-y min-h-[420px] bg-background"
                    />
                  </div>
                </div>
              ) : (
                /* Live Preview */
                <div className="p-6 rounded-xl border border-border bg-card space-y-6 min-h-[450px]">
                  <div className="border-b border-border pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
                        Legal Policy • {editingPolicy.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Published: {editingPolicy.published_at ? new Date(editingPolicy.published_at).toLocaleDateString() : 'Draft'}
                      </span>
                    </div>
                    <h2 className="text-xl font-heading font-bold text-foreground">
                      {editingPolicy.title}
                    </h2>
                  </div>
                  <div className="text-xs md:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed space-y-4">
                    {editingPolicy.content}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Policy Actions */}
            <div className="p-4 md:p-6 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-card/60">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPolicy.is_active}
                  onCheckedChange={(c) => setEditingPolicy({ ...editingPolicy, is_active: c })}
                  id="policy-active"
                />
                <Label htmlFor="policy-active" className="text-xs text-muted-foreground cursor-pointer">
                  Active in User Panel Privacy Page
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSavePolicy()}
                  disabled={savingPolicy}
                  className="h-9 text-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </Button>
                {editingPolicy.is_active ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleSavePolicy(false)}
                    disabled={savingPolicy}
                    className="h-9 text-xs"
                  >
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSavePolicy(true)}
                    disabled={savingPolicy}
                    className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publish to User Panel
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* 3. TERMS & CONDITIONS (platform_terms) */}
        {/* ======================================================== */}
        <TabsContent value="terms" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-600" />
                    {editingTerms.title}
                  </CardTitle>
                  <Badge variant={editingTerms.is_active ? 'default' : 'secondary'} className={`text-[10px] ${editingTerms.is_active ? 'bg-blue-600' : ''}`}>
                    {editingTerms.is_active ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {editingTerms.version}
                  </Badge>
                </div>
                <CardDescription className="text-xs pt-0.5">
                  Connected directly to <code>platform_terms</code> • Last Published:{' '}
                  {editingTerms.published_at
                    ? new Date(editingTerms.published_at).toLocaleString()
                    : 'Not published yet'}
                </CardDescription>
              </div>

              {/* Edit / Preview Tabs */}
              <div className="flex items-center space-x-2 shrink-0">
                <div className="flex border border-border rounded-lg overflow-hidden p-0.5 bg-muted/40">
                  <Button
                    variant={termsMode === 'edit' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTermsMode('edit')}
                    className="h-7 text-xs px-2.5"
                  >
                    Edit Content
                  </Button>
                  <Button
                    variant={termsMode === 'preview' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTermsMode('preview')}
                    className="h-7 text-xs px-2.5"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Live Preview
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 md:p-6 space-y-4">
              {termsMode === 'edit' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Terms Title</Label>
                      <Input
                        value={editingTerms.title}
                        onChange={(e) => setEditingTerms({ ...editingTerms, title: e.target.value })}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Version</Label>
                      <Input
                        value={editingTerms.version}
                        onChange={(e) => setEditingTerms({ ...editingTerms, version: e.target.value })}
                        placeholder="v2.6"
                        className="h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Terms and Conditions Clauses</Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {editingTerms.content.length} characters • Clean structured text
                      </span>
                    </div>
                    <Textarea
                      value={editingTerms.content}
                      onChange={(e) => setEditingTerms({ ...editingTerms, content: e.target.value })}
                      rows={18}
                      placeholder="Enter legal terms and service conditions..."
                      className="text-xs font-mono leading-relaxed resize-y min-h-[420px] bg-background"
                    />
                  </div>
                </div>
              ) : (
                /* Live Preview */
                <div className="p-6 rounded-xl border border-border bg-card space-y-6 min-h-[450px]">
                  <div className="border-b border-border pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-600 bg-blue-500/5">
                        Master Agreement • {editingTerms.version}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Published: {editingTerms.published_at ? new Date(editingTerms.published_at).toLocaleDateString() : 'Draft'}
                      </span>
                    </div>
                    <h2 className="text-xl font-heading font-bold text-foreground">
                      {editingTerms.title}
                    </h2>
                  </div>
                  <div className="text-xs md:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed space-y-4">
                    {editingTerms.content}
                  </div>
                </div>
              )}
            </CardContent>

            {/* Terms Actions */}
            <div className="p-4 md:p-6 border-t border-border flex flex-wrap items-center justify-between gap-3 bg-card/60">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingTerms.is_active}
                  onCheckedChange={(c) => setEditingTerms({ ...editingTerms, is_active: c })}
                  id="terms-active"
                />
                <Label htmlFor="terms-active" className="text-xs text-muted-foreground cursor-pointer">
                  Active in User Panel Terms Page
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveTerms()}
                  disabled={savingTerms}
                  className="h-9 text-xs gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </Button>
                {editingTerms.is_active ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleSaveTerms(false)}
                    disabled={savingTerms}
                    className="h-9 text-xs"
                  >
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSaveTerms(true)}
                    disabled={savingTerms}
                    className="h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Publish to User Panel
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* 4. ANNOUNCEMENTS & NOTICES (cms_content) */}
        {/* ======================================================== */}
        <TabsContent value="announcements" className="space-y-4 pt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-bold text-foreground">
              Platform Broadcasts & Announcements (<code>cms_content</code>)
            </h3>
            <Button
              size="sm"
              onClick={() => {
                setEditingAnnouncement({
                  title: '',
                  subtitle: '',
                  content: '',
                  category: 'announcement',
                  target_audience: 'all',
                  badge_text: 'Urgent',
                  is_active: true
                });
                setAnnouncementModalOpen(true);
              }}
              className="h-8 gap-1.5 text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> New Broadcast
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((ann) => (
              <Card key={ann.id} className="border shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-heading font-bold">{ann.title}</CardTitle>
                    <Badge variant={ann.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {ann.is_active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  {ann.subtitle && (
                    <CardDescription className="text-xs pt-1">{ann.subtitle}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground flex-1">
                  <p className="line-clamp-3">{ann.content}</p>
                </CardContent>
                <div className="p-4 pt-0 border-t border-border flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-muted-foreground">Audience: {ann.target_audience}</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* New Announcement Modal */}
      <Dialog open={announcementModalOpen} onOpenChange={setAnnouncementModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-heading font-bold">Create System Broadcast</DialogTitle>
            <DialogDescription className="text-xs">
              Broadcasts save directly to <code>cms_content</code> and display on user dashboards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Title</Label>
              <Input
                value={editingAnnouncement.title || ''}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                placeholder="e.g. Scheduled Maintenance Window"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Subtitle / Summary</Label>
              <Input
                value={editingAnnouncement.subtitle || ''}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, subtitle: e.target.value })}
                placeholder="Brief summary line"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Content</Label>
              <Textarea
                value={editingAnnouncement.content || ''}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                rows={4}
                placeholder="Detailed message..."
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAnnouncementModalOpen(false)} className="h-9 text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAnnouncement}
              disabled={savingAnnouncement}
              className="h-9 text-xs gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Publish Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
