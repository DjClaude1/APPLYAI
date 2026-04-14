import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Briefcase, Search, TrendingUp, Plus, ArrowRight, Clock, Edit2, Trash2, Loader2, Share2, Mail, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ModernTemplate,
  ClassicTemplate,
  CreativeTemplate,
  MinimalTemplate,
  ExecutiveTemplate
} from '../components/ResumeTemplates';

export default function Dashboard() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<any>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePhone, setSharePhone] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleShareEmail = async () => {
    if (userData?.plan !== 'pro') {
      toast.error('Sharing via Email is a Pro feature.');
      return;
    }
    if (!shareEmail) {
      toast.error('Please enter an email address.');
      return;
    }
    if (!selectedResume) return;

    const element = document.getElementById('resume-preview-hidden');
    if (!element) return;

    setSharing(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Extra pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const fileName = `${(selectedResume.content?.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;

      const response = await fetch('/api/send-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shareEmail,
          pdfBase64,
          fileName,
          subject: `Resume - ${selectedResume.content?.fullName || 'Applicant'}`,
          body: `Hi,\n\nPlease find my resume attached for your review.\n\nBest regards,\n${selectedResume.content?.fullName || 'Applicant'}`
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }

      const result = await response.json();
      if (result.success) {
        toast.success('Resume sent successfully to ' + shareEmail);
        setIsShareDialogOpen(false);
      } else {
        const errorMsg = typeof result.error === 'object' ? (result.error.message || JSON.stringify(result.error)) : result.error;
        throw new Error(errorMsg || 'Failed to send email');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setSharing(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (userData?.plan !== 'pro') {
      toast.error('Sharing via WhatsApp is a Pro feature.');
      return;
    }
    if (!sharePhone) {
      toast.error('Please enter a phone number.');
      return;
    }
    if (!selectedResume) return;

    const publicLink = `${window.location.origin}/resume/${selectedResume.id}`;
    const text = encodeURIComponent(`Hi, please find my resume here: ${publicLink}`);
    window.open(`https://wa.me/${sharePhone.replace(/\D/g, '')}?text=${text}`, '_blank');
    setIsShareDialogOpen(false);
    toast.success('Opening WhatsApp...');
  };

  useEffect(() => {
    if (!user) return;

    const fetchResumes = async () => {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('uid', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching resumes:', error);
        toast.error('Failed to load resumes');
      } else {
        setResumes(data || []);
      }
    };

    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('uid', user.id);

      if (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
      } else {
        setApplications(data || []);
      }
      setLoading(false);
    };

    fetchResumes();
    fetchApplications();

    // Set up real-time subscriptions
    const resumesSubscription = supabase
      .channel('resumes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resumes', filter: `uid=eq.${user.id}` }, fetchResumes)
      .subscribe();

    const appsSubscription = supabase
      .channel('apps_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `uid=eq.${user.id}` }, fetchApplications)
      .subscribe();

    return () => {
      supabase.removeChannel(resumesSubscription);
      supabase.removeChannel(appsSubscription);
    };
  }, [user]);

  const deleteResume = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Resume deleted');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to delete resume');
    }
  };

  const stats = [
    { label: 'Resumes Created', value: userData?.resume_count || 0, icon: <FileText size={20} />, color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Jobs Applied', value: userData?.application_count || 0, icon: <Briefcase size={20} />, color: 'bg-green-500/10 text-green-500' },
    { 
      label: 'Success Rate', 
      value: applications.length > 0 
        ? `${Math.round((applications.filter(a => a.status === 'offered').length / applications.length) * 100)}%` 
        : '0%', 
      icon: <TrendingUp size={20} />, 
      color: 'bg-purple-500/10 text-purple-500' 
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userData?.display_name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Here's what's happening with your job search.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/resume-builder">
            <Button className="gap-2">
              <Plus size={18} /> New Resume
            </Button>
          </Link>
          <Link to="/job-search">
            <Button variant="outline" className="gap-2">
              <Search size={18} /> Find Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Saved Resumes */}
        <Card className="lg:row-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Saved Resumes</CardTitle>
              <CardDescription>Access and edit your previously created CVs.</CardDescription>
            </div>
            <Link to="/resume-builder">
              <Button size="sm" variant="outline" className="gap-2">
                <Plus size={14} /> New
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : resumes.length > 0 ? (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium">{resume.title || 'Untitled Resume'}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> Updated {new Date(resume.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => {
                          setSelectedResume(resume);
                          setIsShareDialogOpen(true);
                        }}
                      >
                        <Share2 size={16} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => navigate(`/resume-builder/${resume.id}`)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteResume(resume.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No resumes found.</p>
                <Link to="/resume-builder">
                  <Button variant="outline">Create Your First Resume</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get things done faster.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ActionItem 
              title="Optimize Existing Resume" 
              description="Upload your resume and get AI suggestions."
              link="/resume-builder"
            />
            <ActionItem 
              title="Generate Cover Letter" 
              description="Create a tailored cover letter for a specific job."
              link="/cover-letter"
            />
            <ActionItem 
              title="Track New Application" 
              description="Manually add a job you applied to elsewhere."
              link="/applications"
            />
          </CardContent>
        </Card>

        {/* Plan Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Plan</CardTitle>
            <CardDescription>Manage your subscription and limits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-6 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg uppercase tracking-wider">{userData?.plan || 'Free'} Plan</span>
                {userData?.plan === 'free' && (
                  <Link to="/settings">
                    <Button size="sm" variant="default">Upgrade to Pro</Button>
                  </Link>
                )}
              </div>
              <div className="space-y-4">
                <LimitProgress label="Resumes" current={userData?.resume_count || 0} limit={userData?.plan === 'pro' ? '∞' : 1} />
                <LimitProgress label="Applications" current={userData?.application_count || 0} limit={userData?.plan === 'pro' ? '∞' : 3} />
              </div>
            </div>
            <Link to="/settings">
              <Button variant="ghost" className="w-full gap-2">
                View Billing Details <ArrowRight size={16} />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Resume</DialogTitle>
            <DialogDescription>
              Send "{selectedResume?.title || 'Untitled Resume'}" directly to hiring managers.
              {userData?.plan !== 'pro' && (
                <Badge variant="secondary" className="ml-2">PRO FEATURE</Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Mail size={16} /> Send via Email
              </Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="hiring@company.com" 
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  disabled={userData?.plan !== 'pro' || sharing}
                />
                <Button onClick={handleShareEmail} disabled={userData?.plan !== 'pro' || sharing}>
                  {sharing ? <Loader2 className="animate-spin" size={16} /> : 'Send'}
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <MessageCircle size={16} /> Send via WhatsApp
              </Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="+1234567890" 
                  value={sharePhone}
                  onChange={(e) => setSharePhone(e.target.value)}
                  disabled={userData?.plan !== 'pro' || sharing}
                />
                <Button onClick={handleShareWhatsApp} disabled={userData?.plan !== 'pro' || sharing}>Send</Button>
              </div>
            </div>
          </div>
          {/* Hidden preview for PDF generation - kept in DOM but off-screen for html2canvas */}
          <div className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none -z-50">
            {selectedResume && (
              <div id="resume-preview-hidden" style={{ width: '794px' }} className="bg-white">
                {selectedResume.content.template === 'modern' && <ModernTemplate resumeData={selectedResume.content} previewId="resume-preview-hidden" />}
                {selectedResume.content.template === 'classic' && <ClassicTemplate resumeData={selectedResume.content} previewId="resume-preview-hidden" />}
                {selectedResume.content.template === 'creative' && <CreativeTemplate resumeData={selectedResume.content} previewId="resume-preview-hidden" />}
                {selectedResume.content.template === 'minimal' && <MinimalTemplate resumeData={selectedResume.content} previewId="resume-preview-hidden" />}
                {selectedResume.content.template === 'executive' && <ExecutiveTemplate resumeData={selectedResume.content} previewId="resume-preview-hidden" />}
              </div>
            )}
          </div>
          {userData?.plan !== 'pro' && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <p className="text-xs text-center font-medium">
                Upgrade to <span className="text-primary font-bold">PRO</span> to unlock direct sharing features.
              </p>
              <Button variant="link" className="w-full h-auto p-0 mt-2 text-xs" onClick={() => navigate('/settings')}>
                Upgrade Now
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionItem({ title, description, link }: { title: string, description: string, link: string }) {
  return (
    <Link to={link} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors group">
      <div>
        <h4 className="font-medium group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}

function LimitProgress({ label, current, limit }: { label: string, current: number, limit: number | string }) {
  const isInfinite = limit === '∞';
  const percentage = isInfinite ? 0 : (current / (limit as number)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{current} / {limit}</span>
      </div>
      {!isInfinite && (
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${percentage >= 100 ? 'bg-destructive' : 'bg-primary'}`} 
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
