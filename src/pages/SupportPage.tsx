import React, { useEffect, useState } from 'react';
import { fetchSupportTickets, respondToSupportTicket, fetchShops } from '@/services/api';
import type { SupportTicket, PrintShop, TicketStatus } from '@/types/types';
import { LifeBuoy, CheckCircle2, Clock, MessageSquare, Send, RefreshCw, AlertCircle, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [shops, setShops] = useState<PrintShop[]>([]);
  const [loading, setLoading] = useState(true);

  // Shop filter for strict isolation inspection
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');

  // Selected Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [nextStatus, setNextStatus] = useState<TicketStatus>('resolved');
  const [savingResponse, setSavingResponse] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, sData] = await Promise.all([
        fetchSupportTickets(),
        fetchShops(100)
      ]);
      setTickets(tData);
      setShops(sData);
    } catch (err) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setResponseText(ticket.admin_response || '');
    setNextStatus(ticket.status === 'open' ? 'in_progress' : ticket.status);
  };

  const handleSaveResponse = async () => {
    if (!selectedTicket) return;
    setSavingResponse(true);
    try {
      await respondToSupportTicket(selectedTicket.id, responseText, nextStatus);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, admin_response: responseText, status: nextStatus, updated_at: new Date().toISOString() }
            : t
        )
      );
      toast.success('Support resolution saved and dispatched to shopkeeper panel');
      setSelectedTicket(null);
    } catch (err) {
      toast.error('Failed to save resolution');
    } finally {
      setSavingResponse(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesShop = selectedShopFilter === 'all' || t.shop_id === selectedShopFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesShop && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            Help & Support Ticket Management
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Strict shopkeeper-isolated support desk. Review technical issues, hardware connectivity problems, and dispatch resolutions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-primary" /> Shopkeeper Support Tickets
              </CardTitle>
              <CardDescription className="text-xs">
                Each ticket is strictly tied to its originating shop ID
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedShopFilter} onValueChange={setSelectedShopFilter}>
                <SelectTrigger className="w-52 h-8 text-xs">
                  <SelectValue placeholder="All Connected Shops" />
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

              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Status: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4 whitespace-nowrap">Shop Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3 px-4 whitespace-nowrap">Subject</th>
                  <th className="py-3 px-4 whitespace-nowrap">Message</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Submitted</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                        {t.shop_name}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px]">
                          {t.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                        {t.subject}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {t.message}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={t.status === 'resolved' ? 'default' : t.status === 'open' ? 'destructive' : 'secondary'}
                          className={`text-[10px] capitalize ${t.status === 'resolved' ? 'bg-emerald-600' : ''}`}
                        >
                          {t.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTicket(t)}
                          className="h-7 text-xs px-2.5"
                        >
                          View & Resolve
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No support tickets matching current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* RESOLUTION MODAL */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              Support Ticket: {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Originating Shop: {selectedTicket?.shop_name} • Category: {selectedTicket?.category}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Shopkeeper Issue:</span>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-foreground">Set Ticket Status:</span>
                <Select value={nextStatus} onValueChange={(val: any) => setNextStatus(val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open (Awaiting Review)</SelectItem>
                    <SelectItem value="in_progress">In Progress (Investigating)</SelectItem>
                    <SelectItem value="resolved">Resolved (Issue Addressed)</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-foreground">Official Admin Response & Guidance:</span>
                <Textarea
                  placeholder="Provide resolution steps or hardware connectivity guidance..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="text-xs min-h-[100px]"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)} disabled={savingResponse} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveResponse} disabled={savingResponse} className="h-8 text-xs gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Save & Dispatch Resolution
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
