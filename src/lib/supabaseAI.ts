import { supabase } from './supabase';
import { toast } from 'sonner';
import { generateAIContent } from './gemini';

/**
 * Utility to call Supabase Edge Functions for AI, Job Search, and Geolocation.
 * You must deploy these functions to your Supabase project.
 */
export const supabaseAI = {
  /**
   * Generates AI content via a Supabase Edge Function with Gemini fallback for actual data
   */
  async generateContent(prompt: string, options: any = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate', {
        body: { prompt, options }
      });
      
      if (error) throw error;
      return { success: true, text: data.text, error: null };
    } catch (error: any) {
      console.warn('Supabase AI Function not ready, trying direct Gemini fallback:', error);
      
      // Try direct Gemini API call for actual data
      const geminiResult = await generateAIContent(prompt, options);
      if (geminiResult.success) {
        return { success: true, text: geminiResult.text, error: null };
      }

      toast.info('Using sample AI data while Edge Functions are being deployed.');
      
      // Provide realistic sample data based on the prompt content
      let fallbackText = '';
      
      if (prompt.toLowerCase().includes('resume summary')) {
        fallbackText = options.jsonMode ? JSON.stringify({
          summary: "Results-driven professional with over 5 years of experience in the industry. Proven track record of delivering high-quality projects and leading cross-functional teams. Expert in modern technologies and best practices, with a strong focus on efficiency and user experience.",
          experience: [
            {
              company: "Tech Solutions Inc.",
              role: "Senior Developer",
              period: "2020 - Present",
              description: "• Led the development of a high-traffic web application using React and Node.js.\n• Mentored junior developers and implemented code review processes.\n• Optimized database queries, resulting in a 30% improvement in performance."
            },
            {
              company: "Creative Agency",
              role: "Web Developer",
              period: "2018 - 2020",
              description: "• Developed responsive websites for diverse clients across various industries.\n• Collaborated with designers to ensure pixel-perfect implementation of UI/UX designs.\n• Integrated third-party APIs and services to enhance website functionality."
            }
          ],
          suggestedSkills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS", "Git", "Agile Methodologies"],
          suggestedReferences: [
            { name: "John Smith", position: "CTO", company: "Tech Solutions Inc.", contact: "john.smith@example.com" },
            { name: "Sarah Johnson", position: "Project Manager", company: "Creative Agency", contact: "sarah.j@example.com" }
          ]
        }) : "Results-driven professional with over 5 years of experience. Expert in modern technologies with a focus on efficiency.";
      } else if (prompt.toLowerCase().includes('cover letter')) {
        fallbackText = "Dear Hiring Manager,\n\nI am writing to express my strong interest in the position at your company. With my background in the field and my passion for delivering exceptional results, I am confident that I would be a valuable asset to your team.\n\nThroughout my career, I have demonstrated a commitment to excellence and a proactive approach to problem-solving. I am particularly drawn to your company's mission and would welcome the opportunity to contribute to your ongoing success.\n\nThank you for your time and consideration. I look forward to the possibility of discussing my qualifications with you further.\n\nSincerely,\n[Your Name]";
      } else {
        fallbackText = options.jsonMode ? "{ \"message\": \"This is sample data provided while the AI function is being deployed.\" }" : "This is sample AI content provided as a fallback while your Supabase Edge Functions are being deployed.";
      }

      return { 
        success: true, 
        text: fallbackText,
        isFallback: true,
        error: null
      };
    }
  },

  /**
   * Searches for jobs via a Supabase Edge Function with comprehensive sample data fallback
   */
  async searchJobs(query: string, location: string, filters: any = {}) {
    try {
      const { data, error } = await supabase.functions.invoke('job-search', {
        body: { query, location, filters }
      });
      
      if (error) throw error;
      return { success: true, jobs: data.jobs, error: null };
    } catch (error: any) {
      console.warn('Supabase job-search function not ready, trying direct Gemini fallback:', error);
      
      // Try direct Gemini API call for actual data
      // We need to format the prompt for job search
      const prompt = `Find 10 real, current job openings for "${query}" in "${location || 'Remote'}". 
      Include: id, title, company, location, type, salary, description, postedAt, link, source.
      Return ONLY a JSON array of objects.`;

      const geminiResult = await generateAIContent(prompt, { jsonMode: true });
      if (geminiResult.success) {
        try {
          const jobs = JSON.parse(geminiResult.text);
          return { success: true, jobs, error: null };
        } catch (e) {
          console.error('Failed to parse Gemini job results:', e);
        }
      }

      toast.info('Using sample job data while Edge Functions are being deployed.');
      
      // Provide a robust list of sample jobs
      const sampleJobs = [
        {
          id: "sample-1",
          title: `Senior ${query || 'Software'} Engineer`,
          company: "Innovation Hub",
          location: location || "New York, NY",
          type: "Full-time",
          salary: "$120k - $160k",
          description: "We are looking for an experienced engineer to join our core team. You will be responsible for building scalable systems and mentoring junior talent.",
          postedAt: "2 days ago",
          link: "#",
          source: "Sample Data"
        },
        {
          id: "sample-2",
          title: `${query || 'Product'} Designer`,
          company: "Design Studio",
          location: location || "Remote",
          type: "Contract",
          salary: "$80/hr - $100/hr",
          description: "Join our creative team to design beautiful and intuitive user interfaces for our global clients.",
          postedAt: "5 hours ago",
          link: "#",
          source: "Sample Data"
        },
        {
          id: "sample-3",
          title: `${query || 'Marketing'} Specialist`,
          company: "Growth Co",
          location: location || "Austin, TX",
          type: "Full-time",
          salary: "$70k - $90k",
          description: "Help us scale our user base through innovative marketing campaigns and data-driven strategies.",
          postedAt: "1 week ago",
          link: "#",
          source: "Sample Data"
        },
        {
          id: "sample-4",
          title: `Junior ${query || 'Frontend'} Developer`,
          company: "Startup Inc",
          location: location || "San Francisco, CA",
          type: "Full-time",
          salary: "$90k - $110k",
          description: "Great opportunity for a junior developer to learn and grow in a fast-paced environment.",
          postedAt: "Just now",
          link: "#",
          source: "Sample Data"
        }
      ];

      return { 
        success: true, 
        isFallback: true,
        jobs: sampleJobs,
        error: null
      };
    }
  },

  /**
   * Reverse geocodes coordinates via a Supabase Edge Function with client-side fallback
   */
  async reverseGeocode(lat: number, lng: number) {
    try {
      const { data, error } = await supabase.functions.invoke('geolocation', {
        body: { lat, lng }
      });
      
      if (error) {
        console.warn('Supabase geolocation function failed, using client-side fallback:', error);
        // Fallback to a direct public API call if the Edge Function isn't ready
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const result = await response.json();
        const city = result.address.city || result.address.town || result.address.village || '';
        const state = result.address.state || '';
        return { success: true, location: city && state ? `${city}, ${state}` : result.display_name };
      }
      return { success: true, location: data.location };
    } catch (error: any) {
      console.error('Supabase Geolocation Error:', error);
      return { success: false, error: error.message };
    }
  }
};
