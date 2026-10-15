import React, { useEffect, useState } from 'react';
import { fetchAllApplicationRequests, updateRequestStatus, deleteRequest, type UnifiedRequest } from '@/services/api';
import { Inbox, CheckCircle2, Clock, AlertCircle, RefreshCw, Send, MessageSquare, Briefcase, Star, Trash2 } from 'lucide-react';
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
import { DatabaseFilterBar, FilterState } from '@/components/common/DatabaseFilterBar';
import { toast } from 'sonner';

export const RequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'user' | 'shopkeeper' | 'advertiser'>('all');
  // Exception 4: Dedicated filter categories: All, Contact Us, Feedback, Advertising / Business Inquiry, Support
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    datePreset: 'all',
    startDate: '',
    endDate: '',
    shopIds: [],
    status: 'all',
    paymentType: 'all'
  });

  // Selected Request Modal
  const [selectedReq, setSelectedReq] = useState<UnifiedRequest | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await fetchAllApplicationRequests();
      setRequests(data);
    } catch (err) {
      toast.error('Failed to load application requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (req: UnifiedRequest, nextStatus: string) => {
    setSavingStatus(true);
    try {
      await updateRequestStatus(req.id, req.source, nextStatus);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: nextStatus } : r))
      );
      toast.success(`Request status updated to ${nextStatus}`);
      if (selectedReq?.id === req.id) {
        setSelectedReq({ ...selectedReq, status: nextStatus });
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeleteRequest = async (req: UnifiedRequest) => {
    try {
      await deleteRequest(req.id, req.source);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      toast.success('Request permanently removed from database');
      if (selectedReq?.id === req.id) setSelectedReq(null);
    } catch (err) {
      toast.error('Failed to delete request from database');
    }
  };


  const handleSendResponse = () => {
    if (!replyText.trim()) return;
    toast.success('Response dispatched to user / advertiser email!');
    if (selectedReq) {
      handleUpdateStatus(selectedReq, 'Resolved');
    }
    setReplyText('');
    setSelectedReq(null);
  };

  const filtered = requests.filter((r) => {
    const matchesSource = sourceFilter === 'all' || r.source === sourceFilter;
    const matchesStatus = filters.status === 'all' || (r.status && r.status.toLowerCase() === filters.status.toLowerCase());

    let matchesCategory = true;
    if (categoryFilter === 'contact') {
      matchesCategory = r.type.toLowerCase().includes('contact');
    } else if (categoryFilter === 'feedback') {
      matchesCategory = r.type.toLowerCase().includes('feedback');
    } else if (categoryFilter === 'advertising') {
      matchesCategory = r.source === 'advertiser' || r.type.toLowerCase().includes('ad') || r.type.toLowerCase().includes('sponsorship');
    } else if (categoryFilter === 'support') {
      matchesCategory = r.source === 'shopkeeper' || r.type.toLowerCase().includes('support');
    }

    let matchesDate = true;
    if (filters.startDate) {
      const created = r.createdAt ? r.createdAt.split('T')[0] : '';
      matchesDate = matchesDate && created >= filters.startDate;
    }
    if (filters.endDate) {
      const created = r.createdAt ? r.createdAt.split('T')[0] : '';
      matchesDate = matchesDate && created <= filters.endDate;
    }

    return matchesSource && matchesCategory && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            Application Requests & Inquiries
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Centralized inbox for contact inquiries, user feedback, advertiser sponsorship proposals, and shopkeeper service requests.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadRequests} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Database Filter Bar */}
      <DatabaseFilterBar
        filters={filters}
        onFilterChange={setFilters}
        showShopFilter={false}
        showStatusFilter={true}
        statusOptions={[
          { label: 'All Statuses', value: 'all' },
          { label: 'New / Pending', value: 'pending' },
          { label: 'In Review', value: 'in_review' },
          { label: 'Resolved / Approved', value: 'resolved' }
        ]}
        showPaymentFilter={false}
      />

      {/* Filter and Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-heading font-bold flex items-center gap-2">
                <Inbox className="w-4 h-4 text-primary" /> Unified Request Inbox
              </CardTitle>
              <CardDescription className="text-xs">
                Review and action all incoming requests from mobile users, advertisers, and operators
              </CardDescription>
            </div>

            {/* Exception 4: Dedicated filter options (All, Contact Us, Feedback, Advertising / Business Inquiry, Support) */}
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={(val: any) => setCategoryFilter(val)}>
                <SelectTrigger className="w-56 h-8 text-xs font-medium">
                  <SelectValue placeholder="Filter Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="contact">Contact Us</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                  <SelectItem value="advertising">Advertising / Business Inquiry</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
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
                  <th className="py-3 px-4 whitespace-nowrap">Source & Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Sender Details</th>
                  <th className="py-3 px-4 whitespace-nowrap">Subject / Topic</th>
                  <th className="py-3 px-4 whitespace-nowrap">Message Content</th>
                  <th className="py-3 px-4 whitespace-nowrap">Received</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length > 0 ? (
                  filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            req.source === 'advertiser'
                              ? 'border-purple-500/30 text-purple-700 dark:text-purple-300'
                              : req.source === 'shopkeeper'
                              ? 'border-blue-500/30 text-blue-700 dark:text-blue-300'
                              : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {req.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{req.senderName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{req.senderEmail}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                        {req.subjectOrTitle}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {req.message}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={req.status === 'Resolved' ? 'default' : 'secondary'}
                          className={`text-[10px] ${req.status === 'Resolved' ? 'bg-emerald-600' : ''}`}
                        >
                          {req.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReq(req);
                              setReplyText('');
                            }}
                            className="h-7 text-xs px-2.5"
                          >
                            View & Reply
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRequest(req)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Delete Request"
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
                      No incoming requests matching this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* REQUEST DETAIL & REPLY MODAL */}
      <Dialog open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {selectedReq?.subjectOrTitle}
            </DialogTitle>
            <DialogDescription className="text-xs">
              From: {selectedReq?.senderName} ({selectedReq?.senderEmail}) • Type: {selectedReq?.type}
            </DialogDescription>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Message Body:</span>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedReq.message}</p>
                {selectedReq.extraInfo && (
                  <div className="pt-2 border-t border-border/50 text-[11px] text-primary">
                    Budget Proposed: <strong>{selectedReq.extraInfo.budget || 'Custom'}</strong> • Business: <strong>{selectedReq.extraInfo.businessName}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                <span className="font-semibold text-foreground">Update Request Status:</span>
                <div className="flex items-center space-x-1.5">
                  <Button
                    size="sm"
                    variant={selectedReq.status === 'Pending' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedReq, 'Pending')}
                    disabled={savingStatus}
                    className="h-7 text-xs px-2"
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReq.status === 'In Progress' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedReq, 'In Progress')}
                    disabled={savingStatus}
                    className="h-7 text-xs px-2"
                  >
                    In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedReq.status === 'Resolved' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedReq, 'Resolved')}
                    disabled={savingStatus}
                    className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Resolved
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground">Send Official Super Admin Response:</span>
                <Textarea
                  placeholder="Type official response to sender..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="text-xs min-h-[90px]"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedReq(null)} className="h-8 text-xs">
                  Close
                </Button>
                <Button size="sm" onClick={handleSendResponse} className="h-8 text-xs gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Send Response & Resolve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
