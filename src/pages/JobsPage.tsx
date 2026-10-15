import React, { useEffect, useState } from 'react';
import {
  fetchCareers,
  saveCareer,
  toggleCareerActive,
  fetchCareerApplications
} from '@/services/api';
import type { Career, CareerApplication } from '@/types/types';
import { Briefcase, Plus, Users, Check, RefreshCw, FileText, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const JobsPage: React.FC = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Job Modal
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Career>>({
    title: '',
    department: 'Print Operations',
    location: 'Pune / On-site',
    type: 'Full-time',
    experience: '1-3 years',
    description: 'Manage print workflow, counter document Xerox, and client services.',
    requirements: 'Familiarity with digital printers, scanning equipment, and computer operations.',
    is_active: true
  });
  const [savingJob, setSavingJob] = useState(false);

  // Application view modal
  const [selectedApp, setSelectedApp] = useState<CareerApplication | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, aData] = await Promise.all([
        fetchCareers(),
        fetchCareerApplications()
      ]);
      setCareers(cData);
      setApplications(aData);
    } catch (err) {
      toast.error('Failed to load career listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateJob = () => {
    setEditingJob({
      title: '',
      department: 'Print Operations',
      location: 'Pune, Maharashtra',
      type: 'Full-time',
      experience: '1-2 years',
      description: 'Oversee document scanning, digital Xerox processing, and point-of-sale customer service.',
      requirements: 'Experience with POS, digital laser copiers, and basic IT troubleshooting.',
      is_active: true
    });
    setJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob.title || !editingJob.department) {
      toast.error('Please enter title and department');
      return;
    }

    setSavingJob(true);
    try {
      await saveCareer({
        ...editingJob,
        title: editingJob.title,
        department: editingJob.department,
        location: editingJob.location || 'Pune'
      });
      toast.success('Job listing published successfully');
      setJobModalOpen(false);
      loadData();
    } catch (err) {
      toast.error('Failed to save job');
    } finally {
      setSavingJob(false);
    }
  };

  const handleToggleJob = async (job: Career) => {
    try {
      await toggleCareerActive(job.id, job.is_active);
      setCareers((prev) =>
        prev.map((c) => (c.id === job.id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success(`Job listing ${job.title} status updated`);
    } catch (err) {
      toast.error('Failed to update job status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 md:p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            Jobs & Career Management
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Super Admin and shopkeeper career opportunities. Published jobs dynamically appear on user-facing platforms.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreateJob} className="h-9 gap-1.5 text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            Publish New Job
          </Button>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid grid-cols-2 h-9 text-xs max-w-md">
          <TabsTrigger value="jobs" className="text-xs">
            Job Postings ({careers.length})
          </TabsTrigger>
          <TabsTrigger value="applicants" className="text-xs">
            Candidate Applications ({applications.length})
          </TabsTrigger>
        </TabsList>

        {/* JOBS TAB */}
        <TabsContent value="jobs" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {careers.map((job) => (
              <Card key={job.id} className="border shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-heading font-bold">{job.title}</CardTitle>
                    <Badge variant={job.is_active ? 'default' : 'secondary'} className={`text-[10px] shrink-0 ${job.is_active ? 'bg-emerald-600' : ''}`}>
                      {job.is_active ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-2 pt-1">
                    <span>{job.department}</span> • <span>{job.location}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 text-xs text-muted-foreground">
                  <p className="line-clamp-2">{job.description}</p>
                  <div className="p-2 bg-muted/60 rounded text-[11px] text-foreground">
                    <strong>Requirements:</strong> {job.requirements}
                  </div>
                </CardContent>
                <div className="p-4 pt-0 border-t border-border/50 flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-muted-foreground font-mono">{job.type} • {job.experience}</span>
                  <div className="space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleJob(job)}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                    >
                      {job.is_active ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingJob(job);
                        setJobModalOpen(true);
                      }}
                      className="h-7 text-xs px-2"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* APPLICANTS TAB */}
        <TabsContent value="applicants" className="space-y-4 pt-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading font-bold">Candidate Submissions</CardTitle>
              <CardDescription className="text-xs">
                Resumes, portfolios, and contact details from job seekers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Applicant</th>
                      <th className="py-3 px-4 whitespace-nowrap">Email</th>
                      <th className="py-3 px-4 whitespace-nowrap">Phone</th>
                      <th className="py-3 px-4 whitespace-nowrap">Job Position</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap">Applied Date</th>
                      <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {applications.length > 0 ? (
                      applications.map((app) => (
                        <tr key={app.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-semibold text-foreground">
                            {app.applicant_name}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                            {app.email}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {app.phone}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-medium">
                            {app.career_title || 'Print Shop Associate'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {app.status || 'Received'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApp(app)}
                              className="h-7 text-xs px-2"
                            >
                              View Profile
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No candidate applications logged yet.
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

      {/* JOB EDIT / CREATE MODAL */}
      <Dialog open={jobModalOpen} onOpenChange={setJobModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {editingJob.id ? 'Edit Career Listing' : 'Publish New Career Opportunity'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide position title, responsibilities, and qualifications.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveJob} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Job Title *</Label>
              <Input
                required
                placeholder="e.g. Senior Print Operator & Store Executive"
                value={editingJob.title || ''}
                onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department *</Label>
                <Input
                  required
                  placeholder="Print Operations / IT Support"
                  value={editingJob.department || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, department: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Location *</Label>
                <Input
                  required
                  placeholder="Pune / Mumbai"
                  value={editingJob.location || ''}
                  onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Job Type</Label>
                <Input
                  placeholder="Full-time / Part-time"
                  value={editingJob.type || 'Full-time'}
                  onChange={(e) => setEditingJob({ ...editingJob, type: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Experience</Label>
                <Input
                  placeholder="1-2 years"
                  value={editingJob.experience || '1-2 years'}
                  onChange={(e) => setEditingJob({ ...editingJob, experience: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Job Description</Label>
              <Textarea
                placeholder="Core day-to-day responsibilities..."
                value={editingJob.description || ''}
                onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                className="text-xs min-h-[70px]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Requirements & Qualifications</Label>
              <Textarea
                placeholder="Skills, hardware familiarity, software..."
                value={editingJob.requirements || ''}
                onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value })}
                className="text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setJobModalOpen(false)} disabled={savingJob} className="h-8 text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={savingJob} className="h-8 text-xs">
                {savingJob ? 'Saving...' : 'Publish Job'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* APPLICANT DETAIL MODAL */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-base font-bold">
              {selectedApp?.applicant_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Candidate for: {selectedApp?.career_title || 'Print Shop Associate'}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-muted rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground font-medium">{selectedApp.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium text-foreground">{selectedApp.phone}</span>
                </div>
                {selectedApp.portfolio_url && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Portfolio:</span>
                    <a href={selectedApp.portfolio_url} target="_blank" rel="noreferrer" className="text-primary underline">
                      {selectedApp.portfolio_url}
                    </a>
                  </div>
                )}
              </div>

              {selectedApp.cover_note && (
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Cover Note:</span>
                  <p className="p-2.5 bg-card border border-border rounded text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedApp.cover_note}
                  </p>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)} className="h-8 text-xs">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
