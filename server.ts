import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  
  // Sanitize and validate the from email
  const getFromEmail = () => {
    const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
    if (envFrom && (envFrom.includes('@') || (envFrom.includes('<') && envFrom.includes('>')))) {
      return envFrom;
    }
    return 'ApplyAI <onboarding@resend.dev>';
  };
  
  const resendFrom = getFromEmail();

  // Initialize Supabase and Gemini for backend use
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
  );
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/send-resume", async (req, res) => {
    const { email, pdfBase64, fileName, subject, body } = req.body;

    if (!resend) {
      return res.status(500).json({ error: "Email service not configured. Please set RESEND_API_KEY." });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: resendFrom,
        to: [email],
        subject: subject || 'Resume Attachment',
        text: body || 'Please find the attached resume.',
        attachments: [
          {
            filename: fileName || 'resume.pdf',
            content: pdfBase64,
          },
        ],
      });

      if (error) {
        console.error('Resend API Error:', error);
        return res.status(400).json({ error });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/process-alerts", async (req, res) => {
    try {
      // 1. Fetch all active alerts with user profiles
      const { data: alerts, error: alertError } = await supabase
        .from('job_alerts')
        .select('*, profiles(email, display_name)')
        .eq('is_active', true);

      if (alertError) throw alertError;
      if (!alerts || alerts.length === 0) {
        return res.json({ message: "No active alerts to process" });
      }

      console.log(`Processing ${alerts.length} job alerts...`);
      const results = [];

      for (const alert of alerts) {
        try {
          // profiles is returned as an object (or null) because it's a 1:1 relation here based on FK
          const profile: any = alert.profiles;
          const userEmail = profile?.email;
          const userName = profile?.display_name || 'there';

          if (!userEmail) {
            console.warn(`No email found for user ${alert.uid}`);
            continue;
          }

          // 2. Search for jobs using Gemini
          const promptText = `Find 3 recent real job postings for "${alert.keywords}" in "${alert.location}". 
          Return a JSON array of objects with fields: title, company, location, link, salary. 
          Return ONLY valid JSON.`;
          
          const aiResult = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            config: {
              responseMimeType: "application/json",
              systemInstruction: "You are a job search assistant. Search for real job postings and return them as a JSON array."
            }
          });

          let jobsText = aiResult.text || "[]";
          
          // Clean possible markdown backticks
          jobsText = jobsText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
          
          const jobs = JSON.parse(jobsText);

          if (Array.isArray(jobs) && jobs.length > 0) {
            // 3. Send email via Resend
            const emailHtml = `
              <h2>Hi ${userName}!</h2>
              <p>We found some new job openings matching your alert: <strong>${alert.keywords}</strong> in <strong>${alert.location}</strong>.</p>
              <ul>
                ${jobs.map((j: any) => `
                  <li style="margin-bottom: 15px;">
                    <strong>${j.title}</strong> at ${j.company}<br/>
                    Location: ${j.location}${j.salary ? ` | Salary: ${j.salary}` : ''}<br/>
                    <a href="${j.link}" style="color: #6366f1; text-decoration: none; font-weight: bold;">View Job Posting →</a>
                  </li>
                `).join('')}
              </ul>
              <p>Happy job hunting!<br/>The ApplyAI Team</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">You received this because you subscribed to job alerts on ApplyAI. You can manage your alerts in Settings.</p>
            `;

            if (resend) {
              await resend.emails.send({
                from: resendFrom,
                to: [userEmail],
                subject: `New Job Alerts: ${alert.keywords}`,
                html: emailHtml
              });
            }

            results.push({ alertId: alert.id, status: 'success', jobsFound: jobs.length });
          } else {
            results.push({ alertId: alert.id, status: 'skipped', message: 'No jobs found' });
          }
        } catch (err: any) {
          console.error(`Error processing alert ${alert.id}:`, err);
          results.push({ alertId: alert.id, status: 'error', message: err.message });
        }
      }

      res.json({ success: true, processed: results.length, results });
    } catch (error: any) {
      console.error('Alerts Processing Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Error handling middleware to ensure JSON responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && 'status' in err && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large. Please try a smaller file or reduce image quality.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
