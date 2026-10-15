import React, { useEffect, useState } from 'react';
import {
  fetchInformationalPages,
  saveInformationalPage,
  fetchCMSContent,
  saveCMSContent,
  deleteCMSContent
} from '@/services/api';
import type { InformationalPage, CMSContent } from '@/types/types';
import {
  FileText,
  Plus,
  Check,
  RefreshCw,
  Trash2,
  Megaphone,
  BookOpen,
  Eye,
  ExternalLink,
  Save,
  Globe,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { toast } from 'sonner';

export const CMSPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'policy_pages' | 'marketing_banners'>('policy_pages');

  // Informational Pages state
  const [pages, setPages] = useState<InformationalPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('about_us');
  const [selectedPage, setSelectedPage] = useState<Partial<InformationalPage>>({
    slug: 'about_us',
    title: 'About Us',
    meta_description: '',
    content_html: '',
    is_published: true
  });
  const [loadingPages, setLoadingPages] = useState(true);
  const [savingPage, setSavingPage] = useState(false);

  // Promotional Content state
  const [contentList, setContentList] = useState<CMSContent[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Partial<CMSContent>>({
    category: 'banner',
    title: '',
    subtitle: '',
    content: '',
    target_audience: 'all',
    badge_text: '',
    is_active: true,
    display_order: 1
  });
  const [submittingContent, setSubmittingContent] = useState(false);

  // New Page creation modal
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');

  // Live preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const loadInformationalPages = async () => {
    setLoadingPages(true);
    try {
      const data = await fetchInformationalPages();
      setPages(data);
      if (data.length > 0) {
        const found = data.find((p) => p.slug === selectedSlug) || data[0];
        setSelectedSlug(found.slug);
        setSelectedPage(found);
      }
    } catch (err: any) {
      toast.error('Failed to load informational pages');
    } finally {
      setLoadingPages(false);
    }
  };

  const loadContent = async () => {
    setLoadingContent(true);
    try {
      const data = await fetchCMSContent();
      setContentList(data);
    } catch (err) {
      toast.error('Failed to load CMS content');
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    loadInformationalPages();
    loadContent();
  }, []);

  const handleSelectPage = (slug: string) => {
    setSelectedSlug(slug);
    const found = pages.find((p) => p.slug === slug);
    if (found) {
      setSelectedPage({ ...found });
    }
  };

  const handleSavePage = async () => {
    if (!selectedPage.title?.trim() || !selectedPage.slug?.trim()) {
      toast.error('Title and slug cannot be empty');
      return;
    }

    setSavingPage(true);
    try {
      await saveInformationalPage({
        slug: selectedPage.slug,
        title: selectedPage.title.trim(),
        meta_description: selectedPage.meta_description || '',
        content_html: selectedPage.content_html || '',
        is_published: selectedPage.is_published ?? true
      });

      toast.success(`"${selectedPage.title}" saved and published successfully!`);
      await loadInformationalPages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save informational page');
    } finally {
      setSavingPage(false);
    }
  };

  const handleCreateNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      toast.error('Please enter page title and URL slug');
      return;
    }

    const cleanSlug = newPageSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    setSavingPage(true);
    try {
      await saveInformationalPage({
        slug: cleanSlug,
        title: newPageTitle.trim(),
        meta_description: `Official ${newPageTitle} documentation for PrintOn24`,
        content_html: `<h2>${newPageTitle}</h2><p>Welcome to the official ${newPageTitle} page. Content is maintained dynamically by the Super Administrator.</p>`,
        is_published: true
      });

      toast.success('New informational page created!');
      setNewPageModalOpen(false);
      setNewPageSlug('');
      setNewPageTitle('');
      setSelectedSlug(cleanSlug);
      await loadInformationalPages();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create page');
    } finally {
      setSavingPage(false);
    }
  };

  // Marketing content methods
  const handleOpenCreateContent = () => {
    setEditingContent({
      category: 'banner',
      title: '',
      subtitle: '',
      content: '',
      target_audience: 'all',
      badge_text: 'NEW',
      is_active: true,
      display_order: 1
    });
    setModalOpen(true);
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent.title || !editingContent.category) {
      toast.error('Please enter title and category');
      return;
    }

    setSubmittingContent(true);
    try {
      await saveCMSContent({
        ...editingContent,
        title: editingContent.title,
        category: editingContent.category as any
      });
      toast.success('CMS content saved successfully');
      setModalOpen(false);
      loadContent();
    } catch (err) {
      toast.error('Failed to save content');
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to remove this content?')) return;
    try {
      await deleteCMSContent(id);
      setContentList((prev) => prev.filter((c) => c.id !== id));
      toast.success('Content deleted');
    } catch (err) {
      toast.error('Failed to delete content');
    }
  };

  const filteredContent = contentList.filter((c) => categoryFilter === 'all' || c.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
              Dynamic CMS & Informational Pages
            </h2>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1.5">
            Manage rich-text policy documents (About Us, Privacy Policy, Terms) and marketing announcements rendered across User and Shopkeeper panels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadInformationalPages();
              loadContent();
            }}
            disabled={loadingPages || loadingContent}
            className="h-9 gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPages || loadingContent ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="h-9">
          <TabsTrigger value="policy_pages" className="text-xs flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Informational & Policy Pages ({pages.length})
          </TabsTrigger>
          <TabsTrigger value="marketing_banners" className="text-xs flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" />
            Promotional & Alert Notices ({contentList.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INFORMATIONAL PAGES WITH RICH-TEXT EDITOR */}
        <TabsContent value="policy_pages" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar List of Pages */}
            <Card className="lg:col-span-1 shadow-sm border border-border h-fit">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-heading font-bold">Document Library</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNewPageModalOpen(true)}
                    className="h-7 text-xs px-2 text-primary hover:bg-primary/10 gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Page
                  </Button>
                </div>
                <CardDescription className="text-[11px]">
                  Select an official document to edit
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {pages.map((p) => {
                  const isSelected = p.slug === selectedSlug;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => handleSelectPage(p.slug)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{p.title}</div>
                        <div className={`text-[10px] font-mono truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          /pages/{p.slug}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 shrink-0 ${
                          isSelected
                            ? 'border-primary-foreground/40 text-primary-foreground'
                            : p.is_published
                            ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                            : 'border-muted text-muted-foreground'
                        }`}
                      >
                        {p.is_published ? 'Live' : 'Draft'}
                      </Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Document Editor Area */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="shadow-sm border border-border">
                <CardHeader className="p-4 md:p-6 pb-4 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-heading font-bold text-foreground">
                          {selectedPage.title || 'Edit Page'}
                        </CardTitle>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          Slug: {selectedPage.slug}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Formatted WYSIWYG editor. Supported formatting: headings, custom fonts, font sizes, alignment, lists, and links.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewModalOpen(true)}
                        className="h-8 text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Client Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSavePage}
                        disabled={savingPage}
                        className="h-8 text-xs gap-1.5 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {savingPage ? 'Publishing...' : 'Save & Publish Page'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4">
                  {/* Meta Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/60">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Page Title</Label>
                      <Input
                        value={selectedPage.title || ''}
                        onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">SEO Meta Description</Label>
                      <Input
                        value={selectedPage.meta_description || ''}
                        onChange={(e) => setSelectedPage({ ...selectedPage, meta_description: e.target.value })}
                        placeholder="Brief summary shown on search engines and share links"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex items-center space-x-2 md:col-span-2 pt-1">
                      <Switch
                        id="publish-toggle"
                        checked={selectedPage.is_published ?? true}
                        onCheckedChange={(checked) => setSelectedPage({ ...selectedPage, is_published: checked })}
                      />
                      <Label htmlFor="publish-toggle" className="text-xs font-medium cursor-pointer">
                        Publicly published (accessible by users, shopkeepers, and visitors)
                      </Label>
                    </div>
                  </div>

                  {/* Rich-Text Editor Component */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Document Rich-Text Content</span>
                      <span className="text-[11px] text-muted-foreground font-normal">
                        Changes are automatically stored and rendered in real time
                      </span>
                    </Label>
                    <RichTextEditor
                      value={selectedPage.content_html || ''}
                      onChange={(html) => setSelectedPage({ ...selectedPage, content_html: html })}
                      placeholder="Start typing your policy or informational document..."
                      minHeight="420px"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PROMOTIONAL & ALERT NOTICES (EXISTING CMS) */}
        <TabsContent value="marketing_banners" className="space-y-4 pt-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-heading font-bold">Platform Content Directory</CardTitle>
                  <CardDescription className="text-xs">
                    Target audiences: All Users, Registered Clients, or Connected Shopkeepers
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-44 h-8 text-xs">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="banner">Promotional Banners</SelectItem>
                      <SelectItem value="announcement">Announcements</SelectItem>
                      <SelectItem value="notice">Notices & Alerts</SelectItem>
                      <SelectItem value="faq">Platform FAQs</SelectItem>
                      <SelectItem value="app_config">App Configurations</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleOpenCreateContent} className="h-8 gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Add Notice
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredContent.map((item) => (
                  <Card key={item.id} className="border shadow-sm flex flex-col justify-between">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize bg-muted font-mono">
                          {item.category}
                        </Badge>
                        <Badge variant={item.is_active ? 'default' : 'secondary'} className={`text-[10px] ${item.is_active ? 'bg-emerald-600' : ''}`}>
                          {item.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-heading font-bold pt-1">{item.title}</CardTitle>
                      {item.subtitle && <CardDescription className="text-xs">{item.subtitle}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-2 flex-1 text-xs text-muted-foreground">
                      <p className="line-clamp-3">{item.content}</p>
                      <div className="flex items-center justify-between text-[10px] pt-2 border-t border-border/50">
                        <span>Audience: <strong>{item.target_audience}</strong></span>
                        <span>Order: <strong>#{item.display_order}</strong></span>
                      </div>
                    </CardContent>
                    <div className="p-3 pt-0 border-t border-border/40 mt-auto flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContent(item.id)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE NEW PAGE MODAL */}
      <Dialog open={newPageModalOpen} onOpenChange={setNewPageModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">Create Informational Page</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new dynamic policy, legal terms, or guidelines page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewPage} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Page Title</Label>
              <Input
                required
                placeholder="e.g. Campus Printing Guidelines"
                value={newPageTitle}
                onChange={(e) => {
                  setNewPageTitle(e.target.value);
                  if (!newPageSlug) {
                    setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
                  }
                }}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">URL Slug (Unique)</Label>
              <div className="flex items-center">
                <span className="h-8 px-2.5 bg-muted border border-r-0 border-border rounded-l-md flex items-center text-muted-foreground font-mono text-[11px]">
                  /pages/
                </span>
                <Input
                  required
                  placeholder="campus_guidelines"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  className="h-8 text-xs font-mono rounded-l-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewPageModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingPage} className="text-xs h-8">
                {savingPage ? 'Creating...' : 'Create Page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CLIENT SIMULATION PREVIEW MODAL */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Document Preview: {selectedPage.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Live simulation of how this page renders across User and Shopkeeper panels.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 bg-card border border-border rounded-xl shadow-inner space-y-4">
            <div className="border-b border-border pb-4">
              <Badge className="bg-emerald-600 mb-2">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified PrintOn24 Policy
              </Badge>
              <h2 className="text-2xl font-bold font-heading">{selectedPage.title}</h2>
              {selectedPage.meta_description && (
                <p className="text-xs text-muted-foreground mt-1">{selectedPage.meta_description}</p>
              )}
            </div>

            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedPage.content_html || '<p>No content entered yet</p>' }}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
              className="text-xs h-8"
            >
              Close Preview
            </Button>
            <a
              href={`/pages/${selectedPage.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="text-xs h-8 gap-1.5">
                Open in Full View <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE CONTENT MODAL (MARKETING) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">Create Marketing Notice</DialogTitle>
            <DialogDescription className="text-xs">
              Broadcast announcements and banners to target users.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveContent} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Title</Label>
              <Input
                required
                value={editingContent.title || ''}
                onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <Select
                value={editingContent.category || 'banner'}
                onValueChange={(val: any) => setEditingContent({ ...editingContent, category: val })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Promotional Banner</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="notice">Notice & Alert</SelectItem>
                  <SelectItem value="faq">Platform FAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Content</Label>
              <Textarea
                required
                value={editingContent.content || ''}
                onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
                className="text-xs min-h-[80px]"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submittingContent} className="text-xs h-8">
                {submittingContent ? 'Saving...' : 'Save Notice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
