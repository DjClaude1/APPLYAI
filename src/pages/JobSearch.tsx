import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, MapPin, Briefcase, Zap, CheckCircle2, Loader2, ExternalLink, Navigation, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { GoogleGenAI, Type } from "@google/genai";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ModernTemplate,
  ClassicTemplate,
  CreativeTemplate,
  MinimalTemplate,
  ExecutiveTemplate
} from '../components/ResumeTemplates';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  postedAt: string;
  link?: string;
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
  const [selectedResumeForApply, setSelectedResumeForApply] = useState<any>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'resumes'),
          where('userId', '==', user.uid),
          orderBy('updatedAt', 'desc'),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        const resumes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserResumes(resumes);
        if (resumes.length > 0) {
          setSelectedResumeForApply(resumes[0]);
        }
      } catch (error) {
        console.error('Error fetching resumes:', error);
      }
    };
    fetchResumes();
  }, [user]);

  const fetchRealJobs = async () => {
    if (!searchTerm && !locationTerm) {
      toast.error('Please enter a job title or location.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Find 5 real current job openings for "${searchTerm}" ${locationTerm ? `in "${locationTerm}"` : '(Remote or Anywhere)'}. 
      Filters to apply:
      - Job Type: ${jobType === 'all' ? 'Any' : jobType}
      - Salary Range: ${minSalary || maxSalary ? `$${minSalary || 0} - $${maxSalary || 'Any'}` : (salaryRange === 'all' ? 'Any' : salaryRange)}
      - Date Posted: ${datePosted === 'all' ? 'Any' : datePosted}
      - Remote Only: ${remoteOnly ? 'Yes' : 'No'}
      - Sort By: ${sortBy}
      - Industry: ${industry === 'all' ? 'Any' : industry}
      - Seniority Level: ${seniority === 'all' ? 'Any' : seniority}
      - Company Size: ${companySize === 'all' ? 'Any' : companySize}
      
      IMPORTANT: Return ONLY a valid JSON array of objects. Do not include markdown formatting or extra text.
      
      Return a JSON array of objects with:
      - id: unique string
      - title: job title
      - company: company name
      - location: city, state
      - type: Full-time, Part-time, or Contract
      - salary: estimated salary range or "Competitive"
      - description: 2-sentence summary
      - postedAt: relative time (e.g. "2 days ago")
      - link: URL to the job posting if available`;

      const response = await (ai.models as any).generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
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
                link: { type: Type.STRING }
              },
              required: ["id", "title", "company", "location"]
            }
          }
        }
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('No response from AI');
      }

      const jobsData = JSON.parse(text);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      
      if (!jobsData || jobsData.length === 0) {
        toast.info('No jobs found. Try a different search.');
      }
    } catch (error) {
      console.error('Job Search Error:', error);
      toast.error('Failed to fetch real-time jobs. Please try again.');
    } finally {
      setLoading(false);
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
          // Use reverse geocoding via Gemini or just a simple prompt
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `What city and state is at coordinates ${latitude}, ${longitude}? Return only "City, State".`,
          });
          setLocationTerm(response.text.trim());
          toast.success('Location updated!');
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

  const handleAutoApply = async (job: Job) => {
    if (!user) return;

    // Check if user has a resume
    if (userResumes.length === 0) {
      toast.error('You need to create a resume first before applying.', {
        action: {
          label: 'Create Resume',
          onClick: () => navigate('/resume-builder')
        }
      });
      return;
    }

    // Check limits for free plan
    if (userData?.plan === 'free' && (userData?.applicationCount || 0) >= 3) {
      toast.error('You have reached the limit of 3 applications on the Free plan. Please upgrade to Pro.');
      return;
    }

    setApplyingId(job.id);
    
    try {
      // 1. Generate PDF of the selected resume
      const element = document.getElementById('resume-preview-apply-hidden');
      if (!element) throw new Error('Preview element not found');

      // Wait a bit for the template to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const fileName = `${(selectedResumeForApply.content?.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;

      // 2. Try to find/guess recruiter email using Gemini
      let recruiterEmail = '';
      try {
        const emailPrompt = `Based on this job posting for ${job.title} at ${job.company}, what is the most likely recruiter or careers email address? 
        Description: ${job.description}
        If you can't find one, suggest a standard one like careers@${job.company.toLowerCase().replace(/\s+/g, '')}.com or hr@${job.company.toLowerCase().replace(/\s+/g, '')}.com.
        Return ONLY the email address.`;
        
        const emailResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: emailPrompt,
        });
        recruiterEmail = emailResponse.text.trim().toLowerCase();
        // Basic validation
        if (!recruiterEmail.includes('@')) {
          recruiterEmail = `careers@${job.company.toLowerCase().replace(/\s+/g, '')}.com`;
        }
      } catch (err) {
        recruiterEmail = `careers@${job.company.toLowerCase().replace(/\s+/g, '')}.com`;
      }

      // 3. Send via API
      const response = await fetch('/api/send-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recruiterEmail,
          pdfBase64,
          fileName,
          subject: `Job Application: ${job.title} - ${selectedResumeForApply.content?.fullName}`,
          body: `Hi Hiring Team at ${job.company},\n\nI am excited to apply for the ${job.title} position advertised. Please find my resume attached for your review.\n\nBest regards,\n${selectedResumeForApply.content?.fullName}`
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send application email');
      }

      // 4. Record in Firestore
      await addDoc(collection(db, 'applications'), {
        userId: user.uid,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        status: 'applied',
        appliedAt: new Date().toISOString(),
        recruiterEmail
      });

      // 5. Update user application count
      await updateDoc(doc(db, 'users', user.uid), {
        applicationCount: increment(1)
      });

      setAppliedJobs(prev => [...prev, job.id]);
      toast.success(`Application sent to ${job.company}!`, {
        description: `Your resume has been emailed to the recruiter.`,
        icon: <CheckCircle2 className="text-green-500" />
      });
    } catch (error: any) {
      console.error('Apply Error:', error);
      toast.error(error.message || 'Failed to submit application.');
    } finally {
      setApplyingId(null);
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
                      {appliedJobs.includes(job.id) && (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                          <CheckCircle2 size={12} /> Applied
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm mb-4">
                      <span className="flex items-center gap-1"><Briefcase size={16} /> {job.company}</span>
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
                          onClick={() => handleAutoApply(job)}
                          disabled={applyingId === job.id}
                        >
                          {applyingId === job.id ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                          Auto Apply
                        </Button>
                        {userData?.plan === 'free' && (userData?.applicationCount || 0) >= 2 && (
                          <p className="text-[10px] text-amber-600 font-medium text-center">
                            {3 - (userData?.applicationCount || 0)} application left on Free plan
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
                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Posted {job.postedAt}
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

      {/* Hidden preview for PDF generation during apply */}
      <div className="hidden">
        {selectedResumeForApply && (
          <div id="resume-preview-apply-hidden">
            {selectedResumeForApply.content.template === 'modern' && <ModernTemplate resumeData={selectedResumeForApply.content} previewId="resume-preview-apply-hidden" />}
            {selectedResumeForApply.content.template === 'classic' && <ClassicTemplate resumeData={selectedResumeForApply.content} previewId="resume-preview-apply-hidden" />}
            {selectedResumeForApply.content.template === 'creative' && <CreativeTemplate resumeData={selectedResumeForApply.content} previewId="resume-preview-apply-hidden" />}
            {selectedResumeForApply.content.template === 'minimal' && <MinimalTemplate resumeData={selectedResumeForApply.content} previewId="resume-preview-apply-hidden" />}
            {selectedResumeForApply.content.template === 'executive' && <ExecutiveTemplate resumeData={selectedResumeForApply.content} previewId="resume-preview-apply-hidden" />}
          </div>
        )}
      </div>
    </div>
  );
}
