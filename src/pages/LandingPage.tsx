import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, Zap, Shield, ArrowRight, Star } from 'lucide-react';

export default function LandingPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-40 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
            >
              <Zap size={16} className="fill-current" />
              <span>The Future of Job Searching is Here</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-6xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.9]">
                Land Your Dream Job with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-600">AI Precision</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
                Generate ATS-friendly resumes, tailored cover letters, and <span className="text-foreground font-semibold">automate your job applications</span>. 
                Empowering professionals to land roles at top companies worldwide.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button size="lg" className="h-16 px-10 text-xl gap-2 shadow-2xl shadow-primary/20 rounded-2xl" onClick={handleGetStarted}>
                  Get Started for Free <ArrowRight size={24} />
                </Button>
                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <span>Joined by 10,000+ professionals</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-500/10 blur-[140px] rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground">Powerful tools designed to give you an unfair advantage.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileText className="text-primary" />}
              title="AI Resume Builder"
              description="Our advanced AI analyzes your skills and experience to generate a professional, ATS-optimized resume in seconds."
            />
            <FeatureCard 
              icon={<Zap className="text-primary" />}
              title="Auto-Apply System"
              description="Apply to hundreds of jobs with a single click. Our system handles the tedious forms so you can focus on interviews."
            />
            <FeatureCard 
              icon={<Shield className="text-primary" />}
              title="ATS Optimization"
              description="Get a real-time score of how well your resume matches a job description and receive actionable tips to improve."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Choose the plan that fits your career goals.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard 
              title="Free"
              price="0"
              features={["1 AI Resume", "3 Job Applications", "Standard Templates", "Community Support"]}
              buttonText="Start for Free"
              onButtonClick={handleGetStarted}
            />
            <PricingCard 
              title="Pro"
              price="9"
              features={["Unlimited Resumes", "Unlimited Applications", "Premium Templates", "Priority AI Generation", "No Watermarks"]}
              highlighted
              buttonText="Go Pro"
              onButtonClick={handleGetStarted}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">© 2026 ApplyAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-background rounded-2xl border hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, features, highlighted = false, buttonText, onButtonClick }: { title: string, price: string, features: string[], highlighted?: boolean, buttonText: string, onButtonClick: () => void }) {
  return (
    <div className={`p-8 rounded-2xl border flex flex-col ${highlighted ? 'border-primary shadow-xl ring-1 ring-primary' : 'bg-background'}`}>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-muted-foreground">/month</span>
      </div>
      <ul className="space-y-4 mb-8 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <CheckCircle2 className="text-primary" size={18} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button variant={highlighted ? 'default' : 'outline'} className="w-full h-12 text-lg" onClick={onButtonClick}>
        {buttonText}
      </Button>
    </div>
  );
}
