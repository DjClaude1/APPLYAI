import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { FileText, Wand2, Download, Save, Plus, Trash2, Loader2, Upload, Layout, ArrowRight, User, Share2, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { supabaseAI } from '../lib/supabaseAI';
import { generateAIContent, cleanJson } from '../lib/gemini';
import { Type } from '@google/genai';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import { useParams, useNavigate } from 'react-router-dom';
import { ResumeData } from '../types';
import {
  ModernTemplate,
  ClassicTemplate,
  CreativeTemplate,
  MinimalTemplate,
  ExecutiveTemplate
} from '../components/ResumeTemplates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

// Set up PDF.js worker
const PDFJS_VERSION = '5.6.205';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export default function ResumeBuilder() {
  const { user, userData } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: userData?.display_name || '',
    jobTitle: '',
    profilePic: '',
    nationality: '',
    idPassport: '',
    email: userData?.email || '',
    phone: '',
    location: '',
    summary: '',
    experience: [{ company: '', role: '', period: '', description: '' }],
    skills: [],
    education: [{ school: '', degree: '', year: '' }],
    references: [{ name: '', position: '', company: '', contact: '' }],
    template: 'modern',
    font: 'sans',
  });

  const [skillInput, setSkillInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePhone, setSharePhone] = useState('');

  const isAdmin = user?.email === 'claudemuteb2@gmail.com';
  const hasPro = userData?.plan === 'pro' || isAdmin;

  // Load existing resume if ID is present
  React.useEffect(() => {
    const loadResume = async () => {
      if (!id || !user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error loading resume:', error);
          toast.error(`Failed to load resume: ${error.message}`);
          throw error;
        }

        if (data) {
          if (data.uid === user.id) {
            const content = data.content;
            setResumeData({
              fullName: content.fullName || '',
              jobTitle: content.jobTitle || '',
              profilePic: content.profilePic || '',
              nationality: content.nationality || '',
              idPassport: content.idPassport || '',
              email: content.email || '',
              phone: content.phone || '',
              location: content.location || '',
              summary: content.summary || '',
              experience: content.experience || [{ company: '', role: '', period: '', description: '' }],
              skills: content.skills || [],
              education: content.education || [{ school: '', degree: '', year: '' }],
              references: content.references || [{ name: '', position: '', company: '', contact: '' }],
              template: content.template || 'modern',
              font: content.font || 'sans',
            });
          } else {
            toast.error('Access denied.');
            navigate('/dashboard');
          }
        } else {
          toast.error('Resume not found.');
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Error loading resume:', error);
        toast.error('Failed to load resume');
      } finally {
        setLoading(false);
      }
    };
    loadResume();
  }, [id, user, navigate]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setResumeData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const newExp = [...resumeData.experience];
    newExp[index] = { ...newExp[index], [field]: value };
    setResumeData(prev => ({ ...prev, experience: newExp }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', role: '', period: '', description: '' }]
    }));
  };

  const removeExperience = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const newEdu = [...resumeData.education];
    newEdu[index] = { ...newEdu[index], [field]: value };
    setResumeData(prev => ({ ...prev, education: newEdu }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', year: '' }]
    }));
  };

  const handleReferenceChange = (index: number, field: string, value: string) => {
    const newRefs = [...resumeData.references];
    newRefs[index] = { ...newRefs[index], [field]: value };
    setResumeData(prev => ({ ...prev, references: newRefs }));
  };

  const addReference = () => {
    setResumeData(prev => ({
      ...prev,
      references: [...prev.references, { name: '', position: '', company: '', contact: '' }]
    }));
  };

  const removeReference = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for base64
      toast.error('Image size should be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setResumeData(prev => ({ ...prev, profilePic: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const addSkill = () => {
    if (skillInput.trim() && !resumeData.skills.includes(skillInput.trim())) {
      setResumeData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setResumeData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const generateWithAI = async () => {
    if (!resumeData.jobTitle || !resumeData.fullName) {
      toast.error('Please enter your name and target job title first.');
      return;
    }

    setLoading(true);
    try {
      const prompt = `Generate a professional resume summary and detailed experience descriptions for a ${resumeData.jobTitle} named ${resumeData.fullName}. 
      Current skills: ${resumeData.skills.join(', ')}.
      Current experience: ${JSON.stringify(resumeData.experience)}.
      
      Return a JSON object with:
      - summary: A compelling 3-4 sentence professional summary.
      - experience: An array of objects with 'company', 'role', 'period', and 'description' (bullet points).
      - suggestedSkills: An array of 5-10 relevant technical skills for this role.
      - suggestedReferences: An array of 2-3 placeholder professional references with 'name', 'position', 'company', and 'contact'.`;

      const result = await generateAIContent(prompt, {
        jsonMode: true,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  period: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["company", "role", "period", "description"]
              }
            },
            suggestedSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedReferences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  position: { type: Type.STRING },
                  company: { type: Type.STRING },
                  contact: { type: Type.STRING }
                },
                required: ["name", "position", "company", "contact"]
              }
            }
          },
          required: ["summary", "experience", "suggestedSkills", "suggestedReferences"]
        }
      });

      if (!result.success) {
        // Fallback to Supabase AI if direct Gemini fails
        const sbResult = await supabaseAI.generateContent(prompt, { jsonMode: true });
        if (!sbResult.success) {
          throw new Error(sbResult.error || 'Failed to generate AI content');
        }
        result.text = sbResult.text;
      }

      const aiResult = JSON.parse(cleanJson(result.text || '{}'));
      setResumeData(prev => ({
        ...prev,
        summary: aiResult.summary,
        experience: aiResult.experience,
        skills: Array.from(new Set([...prev.skills, ...aiResult.suggestedSkills])),
        references: aiResult.suggestedReferences
      }));
      toast.success('AI Resume content generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate AI content.');
    } finally {
      setLoading(false);
    }
  };

  const saveResume = async () => {
    if (!user) return;
    
    // Check limits for free plan
    if (!id && !hasPro && (userData?.resume_count || 0) >= 1) {
      toast.error('You have reached the limit of 1 resume on the Free plan. Please upgrade to Pro.');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        // Update existing
        const { error } = await supabase
          .from('resumes')
          .update({
            title: `${resumeData.jobTitle} Resume`,
            content: resumeData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
        toast.success('Resume updated!');
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('resumes')
          .insert([
            {
              uid: user.id,
              title: `${resumeData.jobTitle} Resume`,
              content: resumeData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (insertError) throw insertError;

        // Update user resume count
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            resume_count: (userData?.resume_count || 0) + 1
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        toast.success('Resume saved to your dashboard!');
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving resume:', error);
      toast.error(error.message || 'Failed to save resume');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('resume-preview');
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resumeData.fullName.replace(' ', '_')}_Resume.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareEmail = async () => {
    if (!hasPro) {
      toast.error('Sharing via Email is a Pro feature.');
      return;
    }
    if (!shareEmail) {
      toast.error('Please enter an email address.');
      return;
    }

    const element = document.getElementById('resume-preview');
    if (!element) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const fileName = `${resumeData.fullName.replace(/\s+/g, '_')}_Resume.pdf`;

      const response = await fetch('/api/send-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shareEmail,
          pdfBase64,
          fileName,
          subject: `Resume - ${resumeData.fullName}`,
          body: `Hi,\n\nPlease find my resume attached for your review.\n\nBest regards,\n${resumeData.fullName}`
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Resume sent successfully to ' + shareEmail);
        setIsShareDialogOpen(false);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!hasPro) {
      toast.error('Sharing via WhatsApp is a Pro feature.');
      return;
    }
    if (!sharePhone) {
      toast.error('Please enter a phone number.');
      return;
    }
    if (!id) {
      toast.error('Please save your resume first to generate a shareable link.');
      return;
    }
    const publicLink = `${window.location.origin}/resume/${id}`;
    const text = encodeURIComponent(`Hi, please find my resume here: ${publicLink}`);
    window.open(`https://wa.me/${sharePhone.replace(/\D/g, '')}?text=${text}`, '_blank');
    setIsShareDialogOpen(false);
    toast.success('Opening WhatsApp...');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          text = fullText;
        } catch (err) {
          throw new Error('Failed to read PDF content. The file might be corrupted or password-protected.');
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } catch (err) {
          throw new Error('Failed to read DOCX content. Please ensure it is a valid Word document.');
        }
      } else {
        toast.error(`Unsupported file type: ${file.type}. Please upload a PDF or DOCX.`);
        setLoading(false);
        return;
      }

      if (!text.trim()) {
        throw new Error('The uploaded file appears to be empty or contains no readable text.');
      }

      const prompt = `Extract resume information from the following text and return it as a structured JSON object.
      Text: ${text}
      
      JSON Schema:
      {
        "fullName": "string",
        "jobTitle": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "summary": "string",
        "experience": [{"company": "string", "role": "string", "period": "string", "description": "string"}],
        "skills": ["string"],
        "education": [{"school": "string", "degree": "string", "year": "string"}],
        "references": [{"name": "string", "position": "string", "company": "string", "contact": "string"}]
      }`;

      const result = await generateAIContent(prompt, {
        jsonMode: true,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            summary: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  period: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["company", "role", "period", "description"]
              }
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  school: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.STRING }
                },
                required: ["school", "degree", "year"]
              }
            },
            references: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  position: { type: Type.STRING },
                  company: { type: Type.STRING },
                  contact: { type: Type.STRING }
                },
                required: ["name", "position", "company", "contact"]
              }
            }
          },
          required: ["fullName", "jobTitle", "email", "phone", "location", "summary", "experience", "skills", "education"]
        }
      });

      if (!result.success) {
        // Fallback to Supabase AI if direct Gemini fails
        const sbResult = await supabaseAI.generateContent(prompt, { jsonMode: true });
        if (!sbResult.success) {
          throw new Error(sbResult.error || 'Failed to parse resume content');
        }
        result.text = sbResult.text;
      }

      const parsedData = JSON.parse(cleanJson(result.text || '{}'));
      setResumeData(prev => ({
        ...prev,
        ...parsedData,
        template: prev.template // Keep current template
      }));
      toast.success('Resume parsed and autofilled!');
    } catch (error) {
      console.error('Upload/Parse Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to parse resume content.';
      toast.error(message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowRight className="rotate-180" size={16} /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">{id ? 'Edit Resume' : 'Create New Resume'}</h1>
      </div>
      <div className="flex flex-col gap-8">
        {/* Editor Side */}
        <div className="w-full space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="text-primary" /> Resume Editor
                  </CardTitle>
                  <CardDescription>Fill in your details or let AI help you.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.docx" 
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                    <Upload size={16} /> Upload CV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basics" className="w-full">
                <TabsList className="grid grid-cols-6 mb-6">
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="basics">Basics</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="references">References</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-bold">Choose a Template</Label>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {resumeData.template.toUpperCase()} SELECTED
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <TemplateOption 
                        active={resumeData.template === 'modern'} 
                        onClick={() => setResumeData(p => ({ ...p, template: 'modern' }))}
                        label="Modern"
                        description="Clean & professional"
                      />
                      <TemplateOption 
                        active={resumeData.template === 'classic'} 
                        onClick={() => {
                          if (!hasPro) {
                            toast.error('Classic template is a Pro feature.');
                            return;
                          }
                          setResumeData(p => ({ ...p, template: 'classic' }));
                        }}
                        label="Classic"
                        description="Traditional serif style"
                        isPro={!hasPro}
                      />
                      <TemplateOption 
                        active={resumeData.template === 'creative'} 
                        onClick={() => {
                          if (!hasPro) {
                            toast.error('Creative template is a Pro feature.');
                            return;
                          }
                          setResumeData(p => ({ ...p, template: 'creative' }));
                        }}
                        label="Creative"
                        description="Bold & unique"
                        isPro={!hasPro}
                      />
                      <TemplateOption 
                        active={resumeData.template === 'minimal'} 
                        onClick={() => {
                          if (!hasPro) {
                            toast.error('Minimal template is a Pro feature.');
                            return;
                          }
                          setResumeData(p => ({ ...p, template: 'minimal' }));
                        }}
                        label="Minimal"
                        description="Simple & elegant"
                        isPro={!hasPro}
                      />
                      <TemplateOption 
                        active={resumeData.template === 'executive'} 
                        onClick={() => {
                          if (!hasPro) {
                            toast.error('Executive template is a Pro feature.');
                            return;
                          }
                          setResumeData(p => ({ ...p, template: 'executive' }));
                        }}
                        label="Executive"
                        description="High-level authority"
                        isPro={!hasPro}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-bold">Typography</Label>
                      {!hasPro && <Badge variant="secondary">PRO FEATURE</Badge>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['sans', 'serif', 'mono', 'display'].map((f) => (
                        <button
                          key={f}
                          disabled={!hasPro}
                          onClick={() => setResumeData(p => ({ ...p, font: f }))}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            resumeData.font === f 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                              : 'border-muted hover:border-primary/30'
                          } ${!hasPro ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className={`text-sm font-${f} capitalize`}>{f}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="basics" className="space-y-4">
                  <div className="flex items-center gap-6 mb-4">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25">
                        {resumeData.profilePic ? (
                          <img src={resumeData.profilePic} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={32} className="text-muted-foreground/50" />
                        )}
                      </div>
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="absolute -bottom-2 -right-2 rounded-full shadow-lg"
                        onClick={() => profilePicInputRef.current?.click()}
                      >
                        <Plus size={16} />
                      </Button>
                      <input 
                        type="file" 
                        ref={profilePicInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleProfilePicUpload}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Profile Photo</h4>
                      <p className="text-xs text-muted-foreground">Upload a professional photo. Max 1MB.</p>
                      {resumeData.profilePic && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-destructive" onClick={() => setResumeData(p => ({ ...p, profilePic: '' }))}>
                          Remove photo
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" name="fullName" value={resumeData.fullName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Target Job Title</Label>
                      <Input id="jobTitle" name="jobTitle" value={resumeData.jobTitle || ''} onChange={handleInputChange} placeholder="e.g. Senior Frontend Engineer" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        value={resumeData.email || ''} 
                        onChange={handleInputChange} 
                        className={emailError ? 'border-destructive' : ''}
                      />
                      {emailError && <p className="text-xs text-destructive">{emailError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" value={resumeData.phone || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input id="nationality" name="nationality" value={resumeData.nationality || ''} onChange={handleInputChange} placeholder="e.g. American" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idPassport">ID / Passport Number</Label>
                      <Input id="idPassport" name="idPassport" value={resumeData.idPassport || ''} onChange={handleInputChange} placeholder="e.g. A1234567" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={resumeData.location || ''} onChange={handleInputChange} placeholder="e.g. New York, NY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea id="summary" name="summary" value={resumeData.summary || ''} onChange={handleInputChange} rows={4} />
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-6">
                  {resumeData.experience.map((exp, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => removeExperience(index)}
                      >
                        <Trash2 size={18} />
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company</Label>
                          <Input value={exp.company || ''} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input value={exp.role || ''} onChange={(e) => handleExperienceChange(index, 'role', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Period</Label>
                        <Input value={exp.period || ''} onChange={(e) => handleExperienceChange(index, 'period', e.target.value)} placeholder="e.g. Jan 2020 - Present" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={exp.description || ''} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)} rows={3} />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2" onClick={addExperience}>
                    <Plus size={18} /> Add Experience
                  </Button>
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add a skill (e.g. React, Python)" 
                      value={skillInput || ''} 
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button onClick={addSkill}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-4">
                    {resumeData.skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 px-3 py-1">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                          <Trash2 size={12} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="education" className="space-y-6">
                  {resumeData.education.map((edu, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="space-y-2">
                        <Label>School / University</Label>
                        <Input value={edu.school || ''} onChange={(e) => handleEducationChange(index, 'school', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Degree</Label>
                          <Input value={edu.degree || ''} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Year</Label>
                          <Input value={edu.year || ''} onChange={(e) => handleEducationChange(index, 'year', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2" onClick={addEducation}>
                    <Plus size={18} /> Add Education
                  </Button>
                </TabsContent>

                <TabsContent value="references" className="space-y-6">
                  {resumeData.references.map((ref, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => removeReference(index)}
                      >
                        <Trash2 size={18} />
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={ref.name || ''} onChange={(e) => handleReferenceChange(index, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Input value={ref.position || ''} onChange={(e) => handleReferenceChange(index, 'position', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Company</Label>
                          <Input value={ref.company || ''} onChange={(e) => handleReferenceChange(index, 'company', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Contact Info</Label>
                          <Input value={ref.contact || ''} onChange={(e) => handleReferenceChange(index, 'contact', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full gap-2" onClick={addReference}>
                    <Plus size={18} /> Add Reference
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4">
            <Button className="flex-1 gap-2 h-12" onClick={saveResume} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {id ? 'Update Resume' : 'Save to Dashboard'}
            </Button>
            <Button variant="secondary" className="flex-1 gap-2 h-12" onClick={generateWithAI} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
              AI Enhance
            </Button>
            <Button variant="outline" className="flex-1 gap-2 h-12" onClick={exportPDF} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              Export PDF
            </Button>
            <Button variant="outline" className="flex-1 gap-2 h-12" onClick={() => setIsShareDialogOpen(true)} disabled={loading}>
              <Share2 size={18} /> Share
            </Button>
          </div>
        </div>

        {/* Preview Side */}
        <div className="w-full">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Live Preview</CardTitle>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                  <div className="w-3 h-3 rounded-full bg-green-500/20" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-muted/20">
              <div className="p-8 flex justify-center">
                <div id="resume-preview" className="shadow-2xl">
                  {resumeData.template === 'modern' && <ModernTemplate resumeData={resumeData} previewId="resume-preview" />}
                  {resumeData.template === 'classic' && <ClassicTemplate resumeData={resumeData} previewId="resume-preview" />}
                  {resumeData.template === 'creative' && <CreativeTemplate resumeData={resumeData} previewId="resume-preview" />}
                  {resumeData.template === 'minimal' && <MinimalTemplate resumeData={resumeData} previewId="resume-preview" />}
                  {resumeData.template === 'executive' && <ExecutiveTemplate resumeData={resumeData} previewId="resume-preview" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Resume</DialogTitle>
            <DialogDescription>
              Send your resume directly to hiring managers.
              {!hasPro && (
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
                  disabled={!hasPro || loading}
                />
                <Button onClick={handleShareEmail} disabled={!hasPro || loading}>
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send'}
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
                  disabled={!hasPro || loading}
                />
                <Button onClick={handleShareWhatsApp} disabled={!hasPro || loading}>Send</Button>
              </div>
            </div>
          </div>
          {!hasPro && (
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

function TemplateOption({ active, onClick, label, description, isPro = false }: { active: boolean, onClick: () => void, label: string, description: string, isPro?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group ${
        active 
          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
          : 'border-muted hover:border-primary/30 bg-background'
      }`}
    >
      {isPro && (
        <Badge variant="secondary" className="absolute -top-1 -right-1 scale-75">PRO</Badge>
      )}
      <div className="flex flex-col gap-1">
        <span className="font-bold text-sm">{label}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">{description}</span>
      </div>
      <div className={`absolute bottom-0 right-0 p-1 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>
        <Layout size={12} className="text-primary" />
      </div>
    </button>
  );
}
