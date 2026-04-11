import React from 'react';
import { ResumeData } from '../types';
import { Badge } from './ui/badge';
import { User } from 'lucide-react';

interface TemplateProps {
  resumeData: ResumeData;
  previewId?: string;
}

export const ModernTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`p-0 min-h-[1122px] w-full max-w-[800px] mx-auto bg-white text-slate-900 font-${resumeData.font || 'sans'} overflow-hidden shadow-2xl flex flex-col`}>
    {/* Top Accent Bar */}
    <div className="h-3 bg-primary w-full" />
    
    <div className="p-8 sm:p-12 flex-grow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start mb-12">
        {resumeData.profilePic ? (
          <div className="relative">
            <img 
              src={resumeData.profilePic} 
              alt="Profile" 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-white shadow-lg z-10 relative"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 w-full h-full bg-primary/10 rounded-2xl -z-0" />
          </div>
        ) : (
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
            <User size={48} className="text-slate-300" />
          </div>
        )}
        <div className="flex-1 text-center sm:text-left pt-2">
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-1 text-slate-900 leading-none">{resumeData.fullName || 'Your Name'}</h1>
          <p className="text-xl sm:text-2xl text-primary font-bold mb-6 tracking-tight">{resumeData.jobTitle || 'Target Job Title'}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="break-all">{resumeData.email}</span>
            </div>
            {resumeData.phone && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{resumeData.phone}</span>
              </div>
            )}
            {resumeData.location && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{resumeData.location}</span>
              </div>
            )}
            {resumeData.nationality && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{resumeData.nationality}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-12">
        <div className="sm:col-span-8 space-y-10">
          {/* Summary */}
          {resumeData.summary && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-3">
                Professional Summary <div className="h-px bg-slate-200 flex-1" />
              </h2>
              <p className="text-slate-700 leading-relaxed text-base">{resumeData.summary}</p>
            </section>
          )}

          {/* Experience */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3">
              Work Experience <div className="h-px bg-slate-200 flex-1" />
            </h2>
            <div className="space-y-8">
              {resumeData.experience.map((exp, i) => (
                <div key={i} className="group">
                  <div className="flex flex-col sm:flex-row justify-between items-baseline mb-2 gap-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{exp.role || 'Role'}</h3>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 rounded text-slate-500 whitespace-nowrap">{exp.period || 'Period'}</span>
                  </div>
                  <p className="text-slate-800 font-bold text-sm mb-3 flex items-center gap-2">
                    {exp.company || 'Company'}
                  </p>
                  <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed pl-4 border-l-2 border-slate-100 group-hover:border-primary/30 transition-colors">
                    {exp.description}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sm:col-span-4 space-y-10">
          {/* Skills */}
          {resumeData.skills.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3">
                Expertise <div className="h-px bg-slate-200 flex-1" />
              </h2>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-primary hover:text-white transition-all rounded-md px-3 py-1 border-none font-bold text-[10px] uppercase tracking-wider">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3">
              Education <div className="h-px bg-slate-200 flex-1" />
            </h2>
            <div className="space-y-6">
              {resumeData.education.map((edu, i) => (
                <div key={i}>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{edu.degree || 'Degree'}</h3>
                  <p className="text-slate-600 text-xs font-medium mb-1">{edu.school || 'School'}</p>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{edu.year || 'Year'}</span>
                </div>
              ))}
            </div>
          </section>

          {/* References */}
          {resumeData.references.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3">
                References <div className="h-px bg-slate-200 flex-1" />
              </h2>
              <div className="space-y-4">
                {resumeData.references.map((ref, i) => (
                  <div key={i} className="text-xs">
                    <h3 className="font-bold text-slate-900 mb-0.5">{ref.name}</h3>
                    <p className="text-slate-500 font-medium mb-1">{ref.position}{ref.company ? ` @ ${ref.company}` : ''}</p>
                    <p className="text-primary font-bold italic break-all">{ref.contact}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  </div>
);

export const ClassicTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`p-12 sm:p-20 min-h-[1122px] w-full max-w-[800px] mx-auto bg-[#FCFAF7] text-[#1A1A1A] font-${resumeData.font || 'serif'} overflow-hidden shadow-xl border border-slate-200`}>
    <div className="text-center mb-16 relative">
      <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 -z-0" />
      <div className="relative z-10 bg-[#FCFAF7] px-8 inline-block">
        <h1 className="text-4xl sm:text-5xl font-serif italic mb-4 tracking-tight text-slate-900">{resumeData.fullName || 'Your Name'}</h1>
        <div className="flex justify-center flex-wrap gap-4 text-xs uppercase tracking-[0.2em] font-bold text-slate-500">
          <span className="break-all">{resumeData.email}</span>
          {resumeData.phone && <span>• {resumeData.phone}</span>}
          {resumeData.location && <span>• {resumeData.location}</span>}
        </div>
      </div>
    </div>

    <div className="space-y-12 max-w-2xl mx-auto">
      {resumeData.summary && (
        <section className="text-center">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Professional Summary</h2>
          <p className="text-base leading-relaxed font-serif italic text-slate-700 px-4">{resumeData.summary}</p>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-8 text-center">Experience</h2>
        <div className="space-y-10">
          {resumeData.experience.map((exp, i) => (
            <div key={i} className="relative">
              <div className="flex flex-col sm:flex-row justify-between items-baseline mb-3 gap-2">
                <h3 className="text-lg font-bold font-serif text-slate-900">{exp.role}</h3>
                <span className="text-xs font-bold italic text-slate-400">{exp.period}</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-4">{exp.company}</p>
              <div className="text-sm leading-relaxed text-slate-700 font-serif whitespace-pre-line pl-6 border-l border-slate-100">
                {exp.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-8 border-t border-slate-100">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Expertise</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {resumeData.skills.map((skill, i) => (
              <span key={i} className="text-sm font-serif italic text-slate-700">{skill}</span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Education</h2>
          <div className="space-y-6">
            {resumeData.education.map((edu, i) => (
              <div key={i}>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{edu.school}</h3>
                <p className="text-slate-600 text-xs italic font-serif">{edu.degree}</p>
                <p className="text-[10px] font-bold text-slate-300 mt-1">{edu.year}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {resumeData.references.length > 0 && (
        <section className="pt-8 border-t border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-8 text-center">References</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {resumeData.references.map((ref, i) => (
              <div key={i} className="text-center sm:text-left">
                <p className="font-bold text-slate-900 mb-1">{ref.name}</p>
                <p className="text-xs text-slate-600 mb-2">{ref.position}{ref.company ? `, ${ref.company}` : ''}</p>
                <p className="text-xs italic font-serif text-slate-400 break-all">{ref.contact}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

export const CreativeTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`min-h-[1122px] w-full max-w-[800px] mx-auto bg-white flex flex-col sm:flex-row text-slate-800 font-${resumeData.font || 'sans'} overflow-hidden shadow-2xl`}>
    {/* Left Sidebar - Bold & Graphic */}
    <div className="w-full sm:w-[35%] bg-slate-900 text-white p-8 sm:p-12 flex flex-col">
      <div className="mb-12 text-center sm:text-left">
        {resumeData.profilePic ? (
          <div className="relative inline-block mb-8">
            <img 
              src={resumeData.profilePic} 
              alt="Profile" 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-primary shadow-2xl relative z-10"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 left-2 w-full h-full rounded-full bg-primary/20 -z-0" />
          </div>
        ) : (
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-700 mb-8 mx-auto sm:mx-0">
            <User size={48} className="text-slate-700" />
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-2 leading-none">{resumeData.fullName}</h1>
        <p className="text-primary font-bold text-sm uppercase tracking-widest">{resumeData.jobTitle}</p>
      </div>
      
      <div className="space-y-10 flex-grow">
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Contact</h2>
          <div className="space-y-3 text-xs font-medium text-slate-300">
            <p className="flex items-center gap-3 break-all">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {resumeData.email}
            </p>
            <p className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {resumeData.phone}
            </p>
            <p className="flex items-center gap-3 break-words">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {resumeData.location}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((s, i) => (
              <span key={i} className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider border border-slate-700 hover:border-primary transition-colors">
                {s}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Education</h2>
          <div className="space-y-6">
            {resumeData.education.map((edu, i) => (
              <div key={i} className="group">
                <p className="font-bold text-sm group-hover:text-primary transition-colors">{edu.degree}</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1">{edu.school}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{edu.year}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
          <div className="w-8 h-px bg-slate-800" /> RESUME 2026
        </div>
      </div>
    </div>

    {/* Right Content - Clean & Structured */}
    <div className="w-full sm:w-[65%] p-8 sm:p-16 space-y-12 bg-[#F9FAFB]">
      <section>
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-4">
          01. Profile <div className="h-px bg-slate-200 flex-1" />
        </h2>
        <p className="text-base leading-relaxed text-slate-600 font-medium">{resumeData.summary}</p>
      </section>

      <section>
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-4">
          02. Experience <div className="h-px bg-slate-200 flex-1" />
        </h2>
        <div className="space-y-10">
          {resumeData.experience.map((exp, i) => (
            <div key={i} className="relative pl-8 group">
              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              <div className="absolute left-[3px] top-4 w-[2px] h-full bg-slate-100 group-last:bg-transparent" />
              
              <div className="flex flex-col sm:flex-row justify-between items-baseline mb-2 gap-2">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors">{exp.role}</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">{exp.period}</span>
              </div>
              <p className="text-sm font-black text-slate-500 mb-4 uppercase tracking-wider">{exp.company}</p>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>

      {resumeData.references.length > 0 && (
        <section>
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center gap-4">
            03. References <div className="h-px bg-slate-200 flex-1" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {resumeData.references.map((ref, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="font-black text-slate-900 text-sm mb-1">{ref.name}</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">{ref.position}</p>
                <p className="text-primary text-[10px] font-black italic break-all">{ref.contact}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

export const MinimalTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`p-8 sm:p-16 min-h-[1122px] w-full max-w-[800px] mx-auto bg-white text-zinc-800 font-${resumeData.font || 'sans'} overflow-hidden break-words`}>
    <div className="mb-12 flex flex-col sm:flex-row justify-between items-center sm:items-start text-center sm:text-left gap-6">
      <div>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight mb-2 break-words">{resumeData.fullName}</h1>
        <p className="text-lg sm:text-xl text-zinc-500 mb-6">{resumeData.jobTitle}</p>
        <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-xs sm:text-sm text-zinc-400">
          <span className="break-all">{resumeData.email}</span>
          <span>{resumeData.phone}</span>
          <span>{resumeData.location}</span>
        </div>
      </div>
      {resumeData.profilePic && (
        <img 
          src={resumeData.profilePic} 
          alt="Profile" 
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover grayscale"
          referrerPolicy="no-referrer"
        />
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 sm:gap-12">
      <div className="sm:col-span-8 space-y-10">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Experience</h2>
          <div className="space-y-8">
            {resumeData.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-bold">{exp.role}</h3>
                  <span className="text-xs text-zinc-400">{exp.period}</span>
                </div>
                <p className="text-sm font-medium text-zinc-600 mb-3">{exp.company}</p>
                <p className="text-sm leading-relaxed text-zinc-500">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="col-span-4 space-y-10">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((s, i) => (
              <span key={i} className="text-sm text-zinc-600">{s}</span>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6">Education</h2>
          {resumeData.education.map((edu, i) => (
            <div key={i} className="mb-4">
              <p className="text-sm font-bold">{edu.degree}</p>
              <p className="text-sm text-zinc-500">{edu.school}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  </div>
);

export const ExecutiveTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`p-6 sm:p-12 min-h-[1122px] w-full max-w-[800px] mx-auto bg-white text-slate-900 border-[6px] sm:border-[12px] border-slate-100 font-${resumeData.font || 'sans'} overflow-hidden break-words`}>
    <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center mb-12 border-b-4 border-slate-900 pb-8 gap-6 text-center sm:text-left">
      <div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter mb-2 break-words">{resumeData.fullName}</h1>
        <p className="text-xl sm:text-2xl font-bold text-primary">{resumeData.jobTitle}</p>
      </div>
      {resumeData.profilePic && (
        <img 
          src={resumeData.profilePic} 
          alt="Profile" 
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-100 shadow-xl"
          referrerPolicy="no-referrer"
        />
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
      <div className="sm:col-span-2 space-y-10">
        <section>
          <h2 className="text-xl font-black uppercase mb-6 border-b-2 border-slate-200 pb-2">Executive Summary</h2>
          <p className="text-slate-700 leading-relaxed">{resumeData.summary}</p>
        </section>
        <section>
          <h2 className="text-xl font-black uppercase mb-6 border-b-2 border-slate-200 pb-2">Professional History</h2>
          <div className="space-y-8">
            {resumeData.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">{exp.role}</h3>
                  <span className="text-sm font-bold text-slate-400">{exp.period}</span>
                </div>
                <p className="text-md font-bold text-slate-600 mb-4">{exp.company}</p>
                <p className="text-slate-600 leading-relaxed">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-black uppercase mb-6 border-b-2 border-slate-200 pb-2">Contact</h2>
          <div className="space-y-3 text-sm font-medium text-slate-600">
            <p>{resumeData.email}</p>
            <p>{resumeData.phone}</p>
            <p>{resumeData.location}</p>
            {resumeData.nationality && <p>{resumeData.nationality}</p>}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-black uppercase mb-6 border-b-2 border-slate-200 pb-2">Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.map((s, i) => (
              <Badge key={i} variant="secondary" className="rounded-none font-bold">{s}</Badge>
            ))}
          </div>
        </section>
      </div>
    </div>
  </div>
);
