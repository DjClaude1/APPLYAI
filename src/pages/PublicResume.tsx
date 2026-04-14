import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ResumeData } from '../types';
import {
  ModernTemplate,
  ClassicTemplate,
  CreativeTemplate,
  MinimalTemplate,
  ExecutiveTemplate
} from '../components/ResumeTemplates';
import { Loader2, AlertCircle, Download, Share2, Mail, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PublicResume() {
  const { id } = useParams();
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('resumes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setResumeData(data.content as ResumeData);
        } else {
          setError('Resume not found.');
        }
      } catch (err: any) {
        console.error('Error fetching resume:', err);
        setError('Failed to load resume.');
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  const exportPDF = async () => {
    const element = document.getElementById('resume-preview');
    if (!element || !resumeData) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resumeData.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Resume: ${resumeData?.fullName}`);
    const body = encodeURIComponent(`Check out my resume at: ${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Check out my resume at: ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <AlertCircle className="text-destructive mb-4" size={64} />
        <h1 className="text-2xl font-bold mb-2">{error || 'Something went wrong'}</h1>
        <p className="text-muted-foreground">The link might be invalid or the resume was deleted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="max-w-[800px] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Share2 size={20} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Share:</span>
          <Button variant="outline" size="icon" onClick={shareViaEmail} title="Share via Email">
            <Mail size={18} />
          </Button>
          <Button variant="outline" size="icon" onClick={shareViaWhatsApp} title="Share via WhatsApp">
            <MessageCircle size={18} />
          </Button>
          <Button variant="outline" size="icon" onClick={copyLink} title="Copy Link">
            <LinkIcon size={18} />
          </Button>
        </div>
        <Button onClick={exportPDF} disabled={exporting} className="gap-2">
          {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          Download PDF
        </Button>
      </div>
      
      <div className="shadow-2xl bg-white">
        <div id="resume-preview">
          {resumeData.template === 'modern' && <ModernTemplate resumeData={resumeData} previewId="resume-preview" />}
          {resumeData.template === 'classic' && <ClassicTemplate resumeData={resumeData} previewId="resume-preview" />}
          {resumeData.template === 'creative' && <CreativeTemplate resumeData={resumeData} previewId="resume-preview" />}
          {resumeData.template === 'minimal' && <MinimalTemplate resumeData={resumeData} previewId="resume-preview" />}
          {resumeData.template === 'executive' && <ExecutiveTemplate resumeData={resumeData} previewId="resume-preview" />}
        </div>
      </div>

      <div className="mt-12 text-center text-muted-foreground text-sm">
        <p>Created with <span className="font-bold text-primary">ApplyAI</span></p>
      </div>
    </div>
  );
}
