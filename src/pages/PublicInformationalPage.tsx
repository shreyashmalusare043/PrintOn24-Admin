import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchInformationalPageBySlug } from '@/services/api';
import type { InformationalPage } from '@/types/types';
import { Printer, ArrowLeft, Calendar, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const PublicInformationalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<InformationalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await fetchInformationalPageBySlug(slug);
        setPage(data);
      } catch (err) {
        console.error('Error fetching page:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse space-y-4 max-w-xl w-full">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <h2 className="text-xl font-bold font-heading">Page Not Found</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          The requested document page does not exist or has been unpublished by the Super Administrator.
        </p>
        <Link to="/login" className="mt-4">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-sm tracking-tight">PrintOn24</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Official Policy
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <Card className="shadow-sm border border-border">
          <CardContent className="p-6 md:p-10 space-y-6">
            <div className="border-b border-border pb-6 space-y-2">
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground">
                {page.title}
              </h1>
              {page.meta_description && (
                <p className="text-sm text-muted-foreground">{page.meta_description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Last reviewed & updated: {new Date(page.updated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Rendered HTML content */}
            <div
              className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: page.content_html || page.content || '' }}
            />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-card">
        <p>© 2026 PrintOn24 Inc. Official Dynamic Content & Operational Guidelines.</p>
      </footer>
    </div>
  );
};
