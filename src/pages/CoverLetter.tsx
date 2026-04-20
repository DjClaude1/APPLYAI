import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { FileText, Wand2, Download, Save, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { generateAIContent } from '../lib/gemini';
import jsPDF from 'jspdf';

export default function CoverLetter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyCulture, setCompanyCulture] = useState('');
  const [achievements, setAchievements] = useState('');
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [template, setTemplate] = useState('professional');

  const templates = [
    { id: 'professional', name: 'Professional', description: 'Standard, formal tone for corporate roles.' },
    { id: 'creative', name: 'Creative', description: 'Bold and unique for startups or design roles.' },
    { id: 'enthusiastic', name: 'Enthusiastic', description: 'High energy and passion for the company.' },
    { id: 'minimalist', name: 'Minimalist', description: 'Short, punchy, and straight to the point.' },
  ];

  useEffect(() => {
    if (user) {
      fetchResumes();
    }
  }, [user]);

  const fetchResumes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('uid', user.id);

      if (error) throw error;
      setResumes(data || []);
      if (data && data.length > 0) setSelectedResume(data[0].id);
    } catch (error: any) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    }
  };

  const generateLetter = async () => {
    if (!selectedResume || !jobDescription) {
      toast.error('Please select a resume and provide a job description.');
      return;
    }

    setLoading(true);
    try {
      const resume = resumes.find(r => r.id === selectedResume);
      const resumeContent = JSON.stringify(resume.content);

      const prompt = `Write a ${template} cover letter based on the following details.
      
      Resume: ${resumeContent}
      
      Job Description: ${jobDescription}
      Company: ${companyName} ${companyWebsite ? `(${companyWebsite})` : ''}
      
      ${companyCulture ? `Company Culture/Values to align with: ${companyCulture}` : ''}
      ${achievements ? `Specific Achievements to highlight: ${achievements}` : ''}
      
      Style Guidelines for "${template}":
      ${template === 'professional' ? '- Formal language, professional tone, focus on ROI and achievements.' : ''}
      ${template === 'creative' ? '- Storytelling approach, unique voice, focus on innovation and personality.' : ''}
      ${template === 'enthusiastic' ? '- High energy, strong focus on company mission, expressive language.' : ''}
      ${template === 'minimalist' ? '- Concise, bullet points for key matches, focus on efficiency.' : ''}

      The cover letter should be tailored to the specific role, highlight relevant skills and experiences, and be approximately 300-400 words. Format it professionally.`;

      const result = await generateAIContent(prompt);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate cover letter');
      }

      setGeneratedLetter(result.text || '');
      toast.success('Cover letter generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate cover letter.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    toast.success('Copied to clipboard!');
  };

  const exportPDF = () => {
    const pdf = new jsPDF();
    const splitText = pdf.splitTextToSize(generatedLetter, 180);
    pdf.text(splitText, 15, 20);
    pdf.save('Cover_Letter.pdf');
    toast.success('PDF exported!');
  };

  const handleSaveToLibrary = async () => {
    if (!user || !generatedLetter) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cover_letters')
        .insert([
          {
            uid: user.id,
            title: `Cover Letter - ${new Date().toLocaleDateString()}`,
            content: generatedLetter,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      toast.success('Cover letter saved to your library!');
    } catch (error: any) {
      console.error('Error saving cover letter:', error);
      toast.error(error.message || 'Failed to save cover letter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">AI Cover Letter Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generator Settings</CardTitle>
              <CardDescription>Select your resume and paste the job description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        template === t.id 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <p className="text-sm font-bold">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Resume</Label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                  {resumes.length === 0 && <option disabled>No resumes found</option>}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea 
                  placeholder="Paste the job requirements here..." 
                  className="min-h-[200px]"
                  value={jobDescription || ''}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    placeholder="e.g. Acme Corp" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Website (Optional)</Label>
                  <Input 
                    placeholder="https://company.com" 
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Culture & Values (Optional)</Label>
                <Textarea 
                  placeholder="Describe the company culture or values you want to align with..." 
                  className="min-h-[80px]"
                  value={companyCulture || ''}
                  onChange={(e) => setCompanyCulture(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Achievements to Highlight (Optional)</Label>
                <Textarea 
                  placeholder="Mention specific achievements or projects you want the AI to emphasize..." 
                  className="min-h-[80px]"
                  value={achievements || ''}
                  onChange={(e) => setAchievements(e.target.value)}
                />
              </div>

              <Button className="w-full gap-2" onClick={generateLetter} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                Generate Tailored Letter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Generated Letter</CardTitle>
                <CardDescription>Review and edit your letter.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!generatedLetter}>
                  <Copy size={16} />
                </Button>
                <Button variant="outline" size="icon" onClick={exportPDF} disabled={!generatedLetter}>
                  <Download size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ScrollArea className="h-[500px] w-full border rounded-md p-4 bg-muted/30">
                <Textarea 
                  value={generatedLetter || ''}
                  onChange={(e) => setGeneratedLetter(e.target.value)}
                  className="min-h-full border-none bg-transparent resize-none focus-visible:ring-0 p-0"
                  placeholder="Your cover letter will appear here..."
                />
              </ScrollArea>
              <div className="mt-4">
                <Button variant="secondary" className="w-full gap-2" disabled={!generatedLetter || loading} onClick={handleSaveToLibrary}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save to Library
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
