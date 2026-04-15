import { useState, useRef } from 'react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { 
  Upload, 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Briefcase, 
  ArrowRight,
  FileText,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { generateAIContent, cleanJson } from '../lib/gemini';
import { Type } from '@google/genai';
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import { motion, AnimatePresence } from 'motion/react';

const PDFJS_VERSION = '5.6.205';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

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

interface ApplicationStatus {
  jobId: string;
  status: 'pending' | 'applying' | 'success' | 'error';
  error?: string;
}

export default function OneClickApply() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'searching' | 'applying' | 'results'>('upload');
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const [foundJobs, setFoundJobs] = useState<Job[]>([]);
  const [appStatuses, setAppStatuses] = useState<Record<string, ApplicationStatus>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file for the 1-Click system.');
      return;
    }

    setFile(selectedFile);
    
    // Convert to base64 for later use
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPdfBase64(base64);
    };
    reader.readAsDataURL(selectedFile);
  };

  const startMagicProcess = async () => {
    if (!file || !pdfBase64) {
      toast.error('Please upload your CV first.');
      return;
    }

    setLoading(true);
    setStep('analyzing');

    try {
      // 1. Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      let hasText = false;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        if (pageText.trim()) hasText = true;
        fullText += pageText + '\n';
      }

      let extractedData: any = null;

      // Fallback: If no text was found (likely a scanned PDF), use AI Vision on the first page
      if (!hasText || !fullText.trim()) {
        setStep('analyzing');
        toast.info('No readable text found. Using AI Vision to analyze your CV...', { duration: 5000 });
        
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await firstPage.render({ canvasContext: context, viewport } as any).promise;
          const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          
          const visionPrompt = `This is a resume image. Extract the candidate's full name, target job title, key skills, and preferred location.
          Return JSON:
          {
            "fullName": "string",
            "jobTitle": "string",
            "skills": ["string"],
            "location": "string"
          }`;

          const visionResult = await generateAIContent(visionPrompt, {
            jsonMode: true,
            inlineData: {
              data: imageData,
              mimeType: 'image/jpeg'
            },
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                jobTitle: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                location: { type: Type.STRING }
              },
              required: ["fullName", "jobTitle", "skills", "location"]
            }
          });

          if (visionResult.success) {
            extractedData = JSON.parse(cleanJson(visionResult.text));
            setExtractedInfo(extractedData);
          } else {
            throw new Error('Could not read text from PDF and AI Vision failed. Please ensure the PDF is not password protected.');
          }
        } else {
          throw new Error('Could not read text from PDF and failed to initialize vision fallback.');
        }
      } else {
        // 2. Analyze with AI (Text-based)
        const analysisPrompt = `Analyze this resume text and extract the candidate's target job title, key skills, and preferred location.
        Text: ${fullText.substring(0, 6000)}
        
        Return JSON:
        {
          "fullName": "string",
          "jobTitle": "string",
          "skills": ["string"],
          "location": "string"
        }`;

        const analysisResult = await generateAIContent(analysisPrompt, {
          jsonMode: true,
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING },
              jobTitle: { type: Type.STRING },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              location: { type: Type.STRING }
            },
            required: ["fullName", "jobTitle", "skills", "location"]
          }
        });

        if (!analysisResult.success) throw new Error('AI analysis failed.');
        extractedData = JSON.parse(cleanJson(analysisResult.text));
        setExtractedInfo(extractedData);
      }

      // 3. Search for Jobs
      setStep('searching');
      const searchPrompt = `Search for 5-8 REAL, CURRENT job openings for a "${extractedData.jobTitle}" in "${extractedData.location || 'Remote'}". 
      Focus on jobs that match these skills: ${extractedData.skills.join(', ')}.
      
      CRITICAL: Return ONLY real jobs with direct application links or recruiter emails if possible.
      
      Return JSON Array of objects:
      {
        "id": "string",
        "title": "string",
        "company": "string",
        "location": "string",
        "type": "string",
        "salary": "string",
        "description": "string",
        "postedAt": "string",
        "link": "string",
        "source": "string"
      }`;

      const searchResult = await generateAIContent(searchPrompt, {
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

      if (!searchResult.success || !searchResult.text) {
        throw new Error(searchResult.error || 'Job search failed to return results.');
      }
      
      const cleanedJobs = cleanJson(searchResult.text);
      if (!cleanedJobs || cleanedJobs === '[]') {
        setStep('upload');
        toast.info('No matching jobs found. Try a different CV or title.');
        return;
      }

      const jobs = JSON.parse(cleanedJobs);
      setFoundJobs(jobs);

      if (jobs.length === 0) {
        setStep('upload');
        toast.info('No matching jobs found. Try a different CV or title.');
        return;
      }

      // 4. Start Applying
      setStep('applying');
      const initialStatuses: Record<string, ApplicationStatus> = {};
      jobs.forEach((j: Job) => {
        initialStatuses[j.id] = { jobId: j.id, status: 'pending' };
      });
      setAppStatuses(initialStatuses);

      // Process applications sequentially to avoid rate limits and for better UI feedback
      for (const job of jobs) {
        setAppStatuses(prev => ({
          ...prev,
          [job.id]: { ...prev[job.id], status: 'applying' }
        }));

        try {
          // 1. Guess recruiter email for this job
          const emailResult = await generateAIContent(`Find or guess the most likely recruiter email for ${job.title} at ${job.company}. Return ONLY the email address.`);
          const email = emailResult.success ? emailResult.text.trim().toLowerCase() : `careers@${job.company.toLowerCase().replace(/\s+/g, '')}.com`;

          // 2. Generate personalized application email body
          const personalizedEmailResult = await generateAIContent(`
            Write a professional and concise job application email for the following position:
            Job Title: ${job.title}
            Company: ${job.company}
            Job Description: ${job.description}
            
            Candidate Name: ${extractedData.fullName}
            Candidate Skills: ${extractedData.skills.join(', ')}
            
            The email should be around 100-150 words, highlight matching skills, and sound enthusiastic. 
            Return ONLY the email body text.
          `);
          
          const emailBody = personalizedEmailResult.success 
            ? personalizedEmailResult.text.trim() 
            : `Hi Hiring Team at ${job.company},\n\nI am excited to apply for the ${job.title} position. Please find my resume attached.\n\nBest regards,\n${extractedData.fullName}`;

          // 3. Send application
          const response = await fetch('/api/send-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              pdfBase64,
              fileName: file.name,
              subject: `Job Application: ${job.title} - ${extractedData.fullName}`,
              body: emailBody
            })
          });

          const resData = await response.json();
          if (!resData.success) throw new Error(resData.error || 'Email failed');

          // Record in DB
          await supabase.from('applications').insert([{
            uid: user?.id,
            job_title: job.title,
            company: job.company,
            location: job.location,
            status: 'applied',
            applied_at: new Date().toISOString(),
            recruiter_email: email,
            job_link: job.link
          }]);

          setAppStatuses(prev => ({
            ...prev,
            [job.id]: { ...prev[job.id], status: 'success' }
          }));
        } catch (err: any) {
          console.error(`Failed to apply to ${job.company}:`, err);
          setAppStatuses(prev => ({
            ...prev,
            [job.id]: { ...prev[job.id], status: 'error', error: err.message }
          }));
        }
        
        // Small delay between applications
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      setStep('results');
      toast.success('Magic Apply process completed!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Magic Apply failed.');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4 gap-1 px-3 py-1 bg-primary/10 text-primary border-primary/20">
          <Zap size={14} className="fill-primary" /> 1-CLICK MAGIC APPLY
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Apply to Jobs Automatically</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Upload your CV and let our AI find matching jobs and submit applications for you in seconds.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/5">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload size={32} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Upload your Resume (PDF)</h3>
                <p className="text-muted-foreground mb-8">We'll analyze your profile and find the best matches.</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3 p-4 bg-background border rounded-xl w-full max-w-md">
                      <FileText className="text-primary" />
                      <div className="flex-1 text-left overflow-hidden">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPdfBase64(null); }}>
                        <X size={18} />
                      </Button>
                    </div>
                    <Button size="lg" className="w-full max-w-md h-14 text-lg gap-2 shadow-xl shadow-primary/20" onClick={startMagicProcess}>
                      <Zap size={20} className="fill-primary-foreground" /> Start Magic Apply
                    </Button>
                  </div>
                ) : (
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={20} /> Select PDF File
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(step === 'analyzing' || step === 'searching' || step === 'applying') && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <Card className="overflow-hidden border-primary/20 shadow-2xl shadow-primary/5">
              <CardContent className="p-12 text-center space-y-8">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap size={48} className="text-primary animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">
                    {step === 'analyzing' && 'Analyzing your CV...'}
                    {step === 'searching' && 'Finding matching jobs...'}
                    {step === 'applying' && 'Applying to jobs...'}
                  </h2>
                  <p className="text-muted-foreground">
                    {step === 'analyzing' && 'Our AI is extracting your skills and experience.'}
                    {step === 'searching' && `Looking for ${extractedInfo?.jobTitle || 'relevant'} roles in ${extractedInfo?.location || 'your area'}.`}
                    {step === 'applying' && 'Submitting your applications to recruiters.'}
                  </p>
                </div>

                {step === 'applying' && (
                  <div className="max-w-md mx-auto space-y-4">
                    {foundJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border text-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Briefcase size={16} className="text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{job.company}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {appStatuses[job.id]?.status === 'pending' && <span className="text-muted-foreground">Waiting...</span>}
                          {appStatuses[job.id]?.status === 'applying' && <Loader2 size={16} className="animate-spin text-primary" />}
                          {appStatuses[job.id]?.status === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                          {appStatuses[job.id]?.status === 'error' && <AlertCircle size={16} className="text-destructive" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Application Results</h2>
              <Button variant="outline" onClick={() => setStep('upload')}>Start New Process</Button>
            </div>

            <div className="grid gap-4">
              {foundJobs.map((job) => (
                <Card key={job.id} className={cn(
                  "border-l-4",
                  appStatuses[job.id]?.status === 'success' ? "border-l-green-500" : "border-l-destructive"
                )}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg">{job.title}</h3>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Briefcase size={16} /> {job.company} • {job.location}
                      </p>
                    </div>
                    <div className="text-right">
                      {appStatuses[job.id]?.status === 'success' ? (
                        <Badge className="bg-green-500 hover:bg-green-600 gap-1">
                          <CheckCircle2 size={12} /> Applied Successfully
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle size={12} /> Failed
                          </Badge>
                          <p className="text-xs text-destructive max-w-[200px] truncate">
                            {appStatuses[job.id]?.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-8 text-center space-y-4">
                <h3 className="text-2xl font-bold">What's Next?</h3>
                <p className="opacity-90">
                  We've sent your resume to {foundJobs.filter(j => appStatuses[j.id]?.status === 'success').length} companies. 
                  You can track all your applications in your dashboard.
                </p>
                <Button variant="secondary" size="lg" onClick={() => navigate('/dashboard')} className="gap-2">
                  Go to Dashboard <ArrowRight size={18} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
