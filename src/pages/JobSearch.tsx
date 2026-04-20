import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, MapPin, Briefcase, Zap, CheckCircle2, Loader2, ExternalLink, Navigation, FileWarning, Plus, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { generateAIContent, cleanJson } from '../lib/gemini';
import { Type } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  ModernTemplate,
  ClassicTemplate,
  CreativeTemplate,
  MinimalTemplate,
  ExecutiveTemplate
} from '../components/ResumeTemplates';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  postedAt: string;
  link: string;
  source: string;
}

export default function JobSearch() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locating, setLocating] = useState(false);
  const [jobType, setJobType] = useState('all');
  const [salaryRange, setSalaryRange] = useState('all');
  const [datePosted, setDatePosted] = useState('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [industry, setIndustry] = useState('all');
  const [seniority, setSeniority] = useState('all');
  const [companySize, setCompanySize] = useState('all');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [userCoverLetters, setUserCoverLetters] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string>('none');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [targetJob, setTargetJob] = useState<Job | null>(null);
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [isGuessingEmail, setIsGuessingEmail] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        // Fetch Resumes
        const { data: resumes, error: resumeError } = await supabase
          .from('resumes')
          .select('*')
          .eq('uid', user.id)
          .order('updated_at', { ascending: false });

        if (resumeError) throw resumeError;
        setUserResumes(resumes || []);
        if (resumes && resumes.length > 0) {
          setSelectedResumeId(resumes[0].id);
        }

        // Fetch Cover Letters
        const { data: cls, error: clError } = await supabase
          .from('cover_letters')
          .select('*')
          .eq('uid', user.id)
          .order('created_at', { ascending: false });

        if (clError) throw clError;
        setUserCoverLetters(cls || []);
      } catch (error) {
        console.error('Error fetching user documents:', error);
      }
    };
    fetchUserData();
  }, [user]);

  const fetchRealJobs = async () => {
    if (!searchTerm && !locationTerm) {
      toast.error('Please enter a job title or location.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Search for 12-15 REAL, CURRENT job openings for "${searchTerm}" ${locationTerm ? `in "${locationTerm}"` : '(Remote or Anywhere)'}. 
      
      CRITICAL INSTRUCTIONS:
      1. SOURCE DIVERSITY: Provide a wide variety of sources. Include listings from LinkedIn, Indeed, Gumtree, Google Search results, and direct Company Career pages. Do NOT include Glassdoor, Reed, Monster, Totaljobs, or ZipRecruiter.
      2. DIRECT URLS ONLY: ONLY return jobs where you have found a direct, functional URL to the SPECIFIC job posting. DO NOT guess, construct, or hallucinate URLs. 
      3. NO SEARCH PAGES: Do not return URLs that point to search results pages. The URL must point to a single, specific job listing.
      4. NO MOCK DATA: Every single job must be a real, live opening as of today.
      5. VERIFICATION: Double-check that the URL is a direct link to the job description.
      6. QUANTITY: Try to find at least 12 high-quality matches if they exist.

      Filters to apply:
      - Job Type: ${jobType === 'all' ? 'Any' : jobType}
      - Salary Range: ${minSalary || maxSalary ? `$${minSalary || 0} - $${maxSalary || 'Any'}` : (salaryRange === 'all' ? 'Any' : salaryRange)}
      - Date Posted: ${datePosted === 'all' ? 'Any' : datePosted}
      - Remote Only: ${remoteOnly ? 'Yes' : 'No'}
      - Sort By: ${sortBy}
      - Industry: ${industry === 'all' ? 'Any' : industry}
      - Seniority Level: ${seniority === 'all' ? 'Any' : seniority}
      - Company Size: ${companySize === 'all' ? 'Any' : companySize}`;

      const result = await generateAIContent(prompt, {
        useSearch: true,
        jsonMode: true,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              type: { type: Type.STRING },
              salary: { type: Type.STRING },
              description: { type: Type.STRING },
              postedAt: { type: Type.STRING },
              link: { type: Type.STRING, description: "The EXACT direct URL to the job posting found in search results" },
              source: { type: Type.STRING, description: "The specific site name (e.g., LinkedIn, Glassdoor, Company Website)" }
            },
            required: ["id", "title", "company", "location", "type", "salary", "description", "postedAt", "link", "source"]
          }
        }
      });

      if (!result.success || !result.text) {
        throw new Error(result.error || 'AI failed to return any job data. Please try again.');
      }

      const cleaned = cleanJson(result.text);
      if (!cleaned || cleaned === '[]') {
        setJobs([]);
        toast.info('No jobs found matching your criteria.');
        return;
      }

      const jobsData = JSON.parse(cleaned);
      const validatedJobs = (Array.isArray(jobsData) ? jobsData : []).map((job: any, index: number) => ({
        ...job,
        id: job.id || `job-${Date.now()}-${index}`
      }));
      
      setJobs(validatedJobs);
      
      if (validatedJobs.length === 0) {
        toast.info('No jobs found. Try a different search.');
      }
    } catch (error: any) {
      console.error('Job Search Error:', error);
      toast.error(error.message?.includes('JSON') ? 'AI returned invalid data. Please try again.' : 'Failed to fetch real-time jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreJobs = async () => {
    if (!searchTerm && !locationTerm) return;
    
    setLoadingMore(true);
    try {
      const existingTitles = jobs.map(j => j.title).join(', ');
      const prompt = `Search for 10 MORE REAL, CURRENT job openings for "${searchTerm}" ${locationTerm ? `in "${locationTerm}"` : '(Remote or Anywhere)'}. 
      
      CRITICAL: These MUST be different from the following jobs already found: ${existingTitles.substring(0, 500)}.
      
      INSTRUCTIONS:
      1. SOURCE DIVERSITY: Use a mix of LinkedIn, Indeed, Gumtree, Google Search results, etc. Do NOT include Glassdoor, Reed, Monster, Totaljobs, or ZipRecruiter.
      2. DIRECT URLS ONLY: No search pages, only specific job listings.
      3. NO MOCK DATA: Real, live openings only.`;

      const result = await generateAIContent(prompt, {
        useSearch: true,
        jsonMode: true,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              type: { type: Type.STRING },
              salary: { type: Type.STRING },
              description: { type: Type.STRING },
              postedAt: { type: Type.STRING },
              link: { type: Type.STRING },
              source: { type: Type.STRING }
            },
            required: ["id", "title", "company", "location", "type", "salary", "description", "postedAt", "link", "source"]
          }
        }
      });

      if (result.success && result.text) {
        try {
          const cleaned = cleanJson(result.text);
          if (!cleaned || cleaned === '[]') {
            toast.info('No more unique jobs found.');
            return;
          }
          const moreJobs = JSON.parse(cleaned);
          if (Array.isArray(moreJobs) && moreJobs.length > 0) {
            const validatedMoreJobs = moreJobs.map((job: any, index: number) => ({
              ...job,
              id: job.id || `job-more-${Date.now()}-${index}`
            }));
            setJobs(prev => [...prev, ...validatedMoreJobs]);
            toast.success(`Found ${validatedMoreJobs.length} more jobs!`);
          } else {
            toast.info('No more unique jobs found.');
          }
        } catch (e) {
          console.error('JSON Parse Error in Load More:', e);
          toast.error('Failed to parse additional jobs.');
        }
      }
    } catch (error) {
      console.error('Load More Error:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use reverse geocoding via AI
          const result = await generateAIContent(`What city and state is at coordinates ${latitude}, ${longitude}? Return only "City, State".`);
          
          if (result.success) {
            setLocationTerm(result.text.trim());
            toast.success('Location updated!');
          } else {
            throw new Error('Failed to identify location');
          }
        } catch (error) {
          console.error(error);
          toast.error('Failed to identify location.');
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error('Permission denied or location unavailable.');
        setLocating(false);
      }
    );
  };

  const openApplyModal = async (job: Job) => {
    setTargetJob(job);
    setIsApplyModalOpen(true);
    setIsGuessingEmail(true);
    
    // Guess email
    try {
      const emailPrompt = `Based on this job posting for ${job.title} at ${job.company}, what is the most likely recruiter or careers email address? 
      Description: ${job.description}
      If you can't find one, suggest a standard one like careers@${job.company.toLowerCase().replace(/\s+/g, '')}.com or hr@${job.company.toLowerCase().replace(/\s+/g, '')}.com.
      Return ONLY the email address.`;
      
      const result = await generateAIContent(emailPrompt);
      if (result.success) {
        setRecruiterEmail(result.text.trim().toLowerCase());
      } else {
        setRecruiterEmail(`careers@${job.company.toLowerCase().replace(/\s+/g, '')}.com`);
      }
    } catch (err) {
      setRecruiterEmail(`careers@${job.company.toLowerCase().replace(/\s+/g, '')}.com`);
    } finally {
      setIsGuessingEmail(false);
    }
  };

  const handleAutoApply = async () => {
    if (!user || !targetJob) return;
    const job = targetJob;

    const selectedResume = userResumes.find(r => r.id === selectedResumeId);
    if (!selectedResume) {
      toast.error('Please select a resume.');
      return;
    }

    if (!recruiterEmail || !recruiterEmail.includes('@')) {
      toast.error('Please enter a valid recruiter email.');
      return;
    }

    setApplyingId(job.id);
    setIsApplyModalOpen(false);
    
    try {
      // 1. Generate PDF of the selected resume
      const element = document.getElementById('resume-preview-apply-hidden');
      if (!element) throw new Error('Preview element not found');

      // Wait a bit for the template to render
      await new Promise(resolve => setTimeout(resolve, 800));

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

      // 2. Prepare Cover Letter or generate personalized email body
      let emailBody = '';
      if (selectedCoverLetterId !== 'none') {
        const cl = userCoverLetters.find(c => c.id === selectedCoverLetterId);
        if (cl) emailBody = cl.content;
      } else {
        // Generate personalized email body using Gemini
        const personalizedEmailResult = await generateAIContent(`
          Write a professional and concise job application email for the following position:
          Job Title: ${job.title}
          Company: ${job.company}
          Job Description: ${job.description}
          
          Candidate Name: ${selectedResume.content?.fullName || 'Candidate'}
          Candidate Skills: ${(selectedResume.content?.skills || []).join(', ')}
          
          The email should be around 100-150 words, highlight matching skills, and sound enthusiastic. 
          Return ONLY the email body text.
        `);
        
        emailBody = personalizedEmailResult.success 
          ? personalizedEmailResult.text.trim() 
          : `Hi Hiring Team at ${job.company},\n\nI am excited to apply for the ${job.title} position advertised. Please find my resume attached for your review.\n\nBest regards,\n${selectedResume.content?.fullName}`;
      }

      // 3. Send via API
      const response = await fetch('/api/send-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recruiterEmail,
          pdfBase64,
          fileName,
          subject: `Job Application: ${job.title} - ${selectedResume.content?.fullName}`,
          body: emailBody
        })
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }

      const result = await response.json();
      if (!result.success) {
        const errorMsg = typeof result.error === 'object' ? (result.error.message || JSON.stringify(result.error)) : result.error;
        throw new Error(errorMsg || 'Failed to send application email');
      }

      // 4. Record in Supabase
      try {
        const { error: appError } = await supabase
          .from('applications')
          .insert([
            {
              uid: user.id,
              job_title: job.title,
              company: job.company,
              location: job.location,
              status: 'applied',
              applied_at: new Date().toISOString(),
              recruiter_email: recruiterEmail,
              job_link: job.link,
              resume_id: selectedResumeId,
              cover_letter_id: selectedCoverLetterId !== 'none' ? selectedCoverLetterId : null
            }
          ]);

        if (appError) throw appError;

        // 5. Update user application count
        const { error: userUpdateError } = await supabase
          .from('profiles')
          .update({
            application_count: (userData?.application_count || 0) + 1
          })
          .eq('id', user.id);

        if (userUpdateError) throw userUpdateError;
      } catch (error: any) {
        console.error('Database Error:', error);
        toast.error('Application sent but failed to save to history.');
      }

      setAppliedJobs(prev => [...prev, job.id]);
      toast.success(`Application sent to ${job.company}!`, {
        description: `Your documents have been emailed to ${recruiterEmail}.`,
        icon: <CheckCircle2 className="text-green-500" />
      });
    } catch (error: any) {
      console.error('Apply Error:', error);
      toast.error(error.message || 'Failed to submit application.');
    } finally {
      setApplyingId(null);
    }
  };

  const handleSaveAlert = async () => {
    if (!user) {
      toast.error('Please sign in to save job alerts.');
      return;
    }

    if (!searchTerm && !locationTerm) {
      toast.error('Please enter keywords or location to save an alert.');
      return;
    }

    setSavingAlert(true);
    try {
      const { error } = await supabase
        .from('job_alerts')
        .insert([
          {
            uid: user.id,
            keywords: searchTerm,
            location: locationTerm,
            active: true,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      toast.success('Job alert created!', {
        description: `We'll email you matching jobs for "${searchTerm}" ${locationTerm ? `in ${locationTerm}` : ''}.`,
        icon: <Bell size={18} className="text-primary" />
      });
    } catch (err: any) {
      console.error('Save Alert Error:', err);
      toast.error('Failed to save job alert.');
    } finally {
      setSavingAlert(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-2">Find Your Next Opportunity</h1>
        <p className="text-muted-foreground">Search thousands of jobs and apply instantly with AI.</p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-12 bg-muted/50 p-6 rounded-2xl border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input 
            placeholder="Job title, keywords, or company" 
            className="pl-10 h-12 bg-background" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRealJobs()}
          />
        </div>
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input 
            placeholder="Location (City, State, or Remote)" 
            className="pl-10 h-12 bg-background pr-12" 
            value={locationTerm}
            onChange={(e) => setLocationTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRealJobs()}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 -translate-y-1/2 text-primary"
            onClick={handleGetLocation}
            disabled={locating}
          >
            {locating ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
          </Button>
        </div>
        <Button size="lg" className="h-12 px-8 gap-2" onClick={fetchRealJobs} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          Search Jobs
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          className="h-12 px-4 gap-2 border-primary/20 hover:border-primary/50 text-primary"
          onClick={handleSaveAlert}
          disabled={savingAlert || (!searchTerm && !locationTerm)}
        >
          {savingAlert ? <Loader2 className="animate-spin" size={20} /> : <Bell size={20} />}
          <span className="hidden sm:inline">Set Alert</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 mb-8 items-center bg-background p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Type:</span>
          <select 
            className="bg-muted/50 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Seniority:</span>
          <select 
            className="bg-muted/50 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted"
            value={seniority}
            onChange={(e) => setSeniority(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="executive">Executive</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Industry:</span>
          <select 
            className="bg-muted/50 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="all">All Industries</option>
            <option value="tech">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Company Size:</span>
          <select 
            className="bg-muted/50 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted"
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
          >
            <option value="all">Any Size</option>
            <option value="startup">Startup (1-50)</option>
            <option value="mid-size">Mid-size (51-500)</option>
            <option value="enterprise">Enterprise (500+)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Salary:</span>
          <div className="flex items-center gap-1">
            <Input 
              placeholder="Min" 
              className="w-20 h-8 text-xs" 
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
            />
            <span className="text-muted-foreground">-</span>
            <Input 
              placeholder="Max" 
              className="w-20 h-8 text-xs" 
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Posted:</span>
          <select 
            className="bg-muted/50 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted"
            value={datePosted}
            onChange={(e) => setDatePosted(e.target.value)}
          >
            <option value="all">Any Time</option>
            <option value="24h">Past 24 hours</option>
            <option value="3d">Past 3 days</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Sort:</span>
          <select 
            className="bg-muted/50 border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="date">Newest First</option>
            <option value="salary-high">Salary: High to Low</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
          />
          <span className="text-sm font-medium">Remote Only</span>
        </label>

        {(jobType !== 'all' || salaryRange !== 'all' || datePosted !== 'all' || remoteOnly || sortBy !== 'relevance' || industry !== 'all' || seniority !== 'all' || companySize !== 'all' || minSalary || maxSalary) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-8 ml-auto"
            onClick={() => {
              setJobType('all');
              setSalaryRange('all');
              setDatePosted('all');
              setRemoteOnly(false);
              setSortBy('relevance');
              setIndustry('all');
              setSeniority('all');
              setCompanySize('all');
              setMinSalary('');
              setMaxSalary('');
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Job Listings */}
      <div className="grid gap-6">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <Badge variant="secondary">{job.type}</Badge>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-primary/20 text-primary/70">
                        {job.source}
                      </Badge>
                      {appliedJobs.includes(job.id) && (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                          <CheckCircle2 size={12} /> Applied
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm mb-4">
                      <span className="flex items-center gap-1">
                        <Briefcase size={16} /> {job.company} 
                        <span className="mx-1 text-muted-foreground/30">•</span>
                        <span className="text-primary font-medium">{job.source}</span>
                      </span>
                      <span className="flex items-center gap-1"><MapPin size={16} /> {job.location}</span>
                      <span className="font-medium text-foreground">{job.salary}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center min-w-[160px]">
                    {appliedJobs.includes(job.id) ? (
                      <Button variant="outline" disabled className="gap-2 text-green-600 border-green-200 bg-green-50">
                        <CheckCircle2 size={18} /> Applied
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <Button 
                          className="gap-2 w-full" 
                          onClick={() => openApplyModal(job)}
                          disabled={applyingId === job.id}
                        >
                          {applyingId === job.id ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                          Auto Apply
                        </Button>
                        {userData?.plan === 'free' && (userData?.application_count || 0) >= 2 && (
                          <p className="text-[10px] text-amber-600 font-medium text-center">
                            {3 - (userData?.application_count || 0)} application left on Free plan
                          </p>
                        )}
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      className="gap-2"
                      onClick={() => job.link && window.open(job.link, '_blank')}
                      disabled={!job.link}
                    >
                      View Details <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                  <span>Posted {job.postedAt}</span>
                  <span className="flex items-center gap-1 italic">
                    <CheckCircle2 size={12} className="text-green-500" /> Verified Listing from {job.source}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
            <Search className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="text-xl font-bold mb-2">No jobs found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms or location.</p>
          </div>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="mt-12 flex justify-center">
          <Button 
            variant="outline" 
            size="lg" 
            className="px-12 gap-2" 
            onClick={loadMoreJobs} 
            disabled={loadingMore}
          >
            {loadingMore ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            {loadingMore ? 'Searching for more...' : 'Load More Jobs'}
          </Button>
        </div>
      )}

      {/* Hidden preview for PDF generation during apply - kept in DOM but off-screen for html2canvas */}
      <div className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none -z-50">
        {userResumes.find(r => r.id === selectedResumeId) && (
          <div id="resume-preview-apply-hidden" style={{ width: '794px' }} className="bg-white">
            {userResumes.find(r => r.id === selectedResumeId).content.template === 'modern' && <ModernTemplate resumeData={userResumes.find(r => r.id === selectedResumeId).content} previewId="resume-preview-apply-hidden" />}
            {userResumes.find(r => r.id === selectedResumeId).content.template === 'classic' && <ClassicTemplate resumeData={userResumes.find(r => r.id === selectedResumeId).content} previewId="resume-preview-apply-hidden" />}
            {userResumes.find(r => r.id === selectedResumeId).content.template === 'creative' && <CreativeTemplate resumeData={userResumes.find(r => r.id === selectedResumeId).content} previewId="resume-preview-apply-hidden" />}
            {userResumes.find(r => r.id === selectedResumeId).content.template === 'minimal' && <MinimalTemplate resumeData={userResumes.find(r => r.id === selectedResumeId).content} previewId="resume-preview-apply-hidden" />}
            {userResumes.find(r => r.id === selectedResumeId).content.template === 'executive' && <ExecutiveTemplate resumeData={userResumes.find(r => r.id === selectedResumeId).content} previewId="resume-preview-apply-hidden" />}
          </div>
        )}
      </div>

      {/* Apply Confirmation Modal */}
      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirm Application</DialogTitle>
            <DialogDescription>
              Review your documents and the recipient's email before applying to <strong>{targetJob?.company}</strong>.
              <span className="text-[10px] text-muted-foreground block mt-1 italic">
                Note: If using a Resend testing account, you can only send to your own registered email address.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="resume-select">Select Resume</Label>
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger id="resume-select">
                  <SelectValue placeholder="Choose a resume" />
                </SelectTrigger>
                <SelectContent>
                  {userResumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title || 'Untitled Resume'}
                    </SelectItem>
                  ))}
                  {userResumes.length === 0 && (
                    <SelectItem value="none" disabled>No resumes found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-letter-select">Select Cover Letter (Optional)</Label>
              <Select value={selectedCoverLetterId} onValueChange={setSelectedCoverLetterId}>
                <SelectTrigger id="cover-letter-select">
                  <SelectValue placeholder="Choose a cover letter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Cover Letter</SelectItem>
                  {userCoverLetters.map((cl) => (
                    <SelectItem key={cl.id} value={cl.id}>
                      {cl.title || 'Untitled Cover Letter'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recruiter-email">Recruiter Email</Label>
              <div className="relative">
                <Input 
                  id="recruiter-email" 
                  value={recruiterEmail} 
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className={isGuessingEmail ? "pr-10" : ""}
                />
                {isGuessingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-primary" size={16} />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {isGuessingEmail ? "AI is guessing the best contact email..." : "We've guessed this email based on the job post. Please verify it."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAutoApply} 
              disabled={!selectedResumeId || !recruiterEmail || applyingId !== null}
              className="gap-2"
            >
              {applyingId ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              Send Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
