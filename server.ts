import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const resendFrom = process.env.RESEND_FROM_EMAIL || 'ApplyAI <onboarding@resend.dev>';
  
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
        return res.status(400).json({ error });
      }

      res.json({ success: true, data });
    } catch (error: any) {
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
