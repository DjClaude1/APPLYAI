import React from 'react';
import { ResumeData } from '../types';
import { Badge } from './ui/badge';
import { User } from 'lucide-react';

interface TemplateProps {
  resumeData: ResumeData;
  previewId?: string;
}

export const ModernTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`p-4 sm:p-12 min-h-[1122px] w-full max-w-[800px] mx-auto bg-white text-slate-900 font-${resumeData.font || 'sans'} overflow-hidden break-words`}>
    {/* Header */}
    <div className="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
      {resumeData.profilePic && (
        <img 
          src={resumeData.profilePic} 
          alt="Profile" 
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover border-2 border-slate-900"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="flex-1 w-full">
        <h1 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-2 break-words">{resumeData.fullName || 'Your Name'}</h1>
        <p className="text-lg sm:text-xl text-slate-600 font-medium mb-4">{resumeData.jobTitle || 'Target Job Title'}</p>
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
          <span className="break-all">{resumeData.email}</span>
          {resumeData.phone && <span>• {resumeData.phone}</span>}
          {resumeData.location && <span>• {resumeData.location}</span>}
          {resumeData.nationality && <span>• {resumeData.nationality}</span>}
          {resumeData.idPassport && <span>• ID: {resumeData.idPassport}</span>}
        </div>
      </div>
    </div>

    {/* Summary */}
    {resumeData.summary && (
      <div className="mb-8">
        <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-slate-900 border-b border-slate-200 pb-1">Professional Summary</h2>
        <p className="text-slate-700 leading-relaxed">{resumeData.summary}</p>
      </div>
    )}

    {/* Experience */}
    <div className="mb-8">
      <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-slate-900 border-b border-slate-200 pb-1">Professional Experience</h2>
      <div className="space-y-6">
        {resumeData.experience.map((exp, i) => (
          <div key={i}>
            <div className="flex flex-col sm:flex-row justify-between items-start mb-1 gap-1">
              <h3 className="font-bold text-slate-900">{exp.role || 'Role'}</h3>
              <span className="text-xs sm:text-sm text-slate-500 italic">{exp.period || 'Period'}</span>
            </div>
            <p className="text-slate-700 font-semibold mb-2">{exp.company || 'Company'}</p>
            <div className="text-slate-600 text-sm whitespace-pre-line leading-relaxed break-words">
              {exp.description}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Skills */}
    {resumeData.skills.length > 0 && (
      <div className="mb-8">
        <h2 className="text-lg font-bold uppercase tracking-wider mb-3 text-slate-900 border-b border-slate-200 pb-1">Skills</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {resumeData.skills.map((skill, i) => (
            <span key={i} className="text-slate-700">• {skill}</span>
          ))}
        </div>
      </div>
    )}

    {/* Education */}
    <div className="mb-8">
      <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-slate-900 border-b border-slate-200 pb-1">Education</h2>
      <div className="space-y-4">
        {resumeData.education.map((edu, i) => (
          <div key={i} className="flex flex-col sm:flex-row justify-between items-start gap-1">
            <div>
              <h3 className="font-bold text-slate-900">{edu.degree || 'Degree'}</h3>
              <p className="text-slate-700">{edu.school || 'School'}</p>
            </div>
            <span className="text-xs sm:text-sm text-slate-500 italic">{edu.year || 'Year'}</span>
          </div>
        ))}
      </div>
    </div>

    {/* References */}
    {resumeData.references.length > 0 && (
      <div>
        <h2 className="text-lg font-bold uppercase tracking-wider mb-4 text-slate-900 border-b border-slate-200 pb-1">References</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {resumeData.references.map((ref, i) => (
            <div key={i}>
              <h3 className="font-bold text-slate-900">{ref.name || 'Reference Name'}</h3>
              <p className="text-sm text-slate-700">{ref.position}{ref.company ? `, ${ref.company}` : ''}</p>
              <p className="text-sm text-slate-500 italic break-all">{ref.contact}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const ClassicTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`p-6 sm:p-12 min-h-[1122px] w-full max-w-[800px] mx-auto bg-white text-slate-900 font-${resumeData.font || 'serif'} overflow-hidden break-words`}>
    <div className="text-center mb-8">
      {resumeData.profilePic && (
        <img 
          src={resumeData.profilePic} 
          alt="Profile" 
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto mb-4 border border-slate-300"
          referrerPolicy="no-referrer"
        />
      )}
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{resumeData.fullName || 'Your Name'}</h1>
      <div className="flex justify-center flex-wrap gap-2 text-xs sm:text-sm text-slate-600">
        <span className="break-all">{resumeData.email}</span>
        {resumeData.phone && <span>| {resumeData.phone}</span>}
        {resumeData.location && <span>| {resumeData.location}</span>}
        {resumeData.nationality && <span>| {resumeData.nationality}</span>}
      </div>
    </div>

    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-bold border-b-2 border-slate-800 mb-2">SUMMARY</h2>
        <p className="text-sm leading-relaxed">{resumeData.summary}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold border-b-2 border-slate-800 mb-3">EXPERIENCE</h2>
        <div className="space-y-4">
          {resumeData.experience.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between font-bold">
                <span>{exp.company}</span>
                <span>{exp.period}</span>
              </div>
              <div className="italic mb-1">{exp.role}</div>
              <div className="text-sm whitespace-pre-line pl-4">{exp.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold border-b-2 border-slate-800 mb-2">SKILLS</h2>
        <p className="text-sm">{resumeData.skills.join(', ')}</p>
      </section>

      <section>
        <h2 className="text-lg font-bold border-b-2 border-slate-800 mb-2">EDUCATION</h2>
        {resumeData.education.map((edu, i) => (
          <div key={i} className="flex justify-between text-sm">
            <div>
              <span className="font-bold">{edu.school}</span>, {edu.degree}
            </div>
            <span className="italic">{edu.year}</span>
          </div>
        ))}
      </section>

      {resumeData.references.length > 0 && (
        <section>
          <h2 className="text-lg font-bold border-b-2 border-slate-800 mb-2">REFERENCES</h2>
          <div className="grid grid-cols-2 gap-4">
            {resumeData.references.map((ref, i) => (
              <div key={i} className="text-sm">
                <p className="font-bold">{ref.name}</p>
                <p>{ref.position}{ref.company ? `, ${ref.company}` : ''}</p>
                <p className="italic text-slate-600">{ref.contact}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

export const CreativeTemplate = ({ resumeData, previewId = "resume-preview" }: TemplateProps) => (
  <div id={previewId} className={`min-h-[1122px] w-full max-w-[800px] mx-auto bg-slate-50 flex flex-col sm:flex-row text-slate-800 font-${resumeData.font || 'sans'} overflow-hidden break-words`}>
    <div className="w-full sm:w-1/3 bg-slate-800 text-white p-6 sm:p-8 space-y-8">
      <div className="text-center">
        {resumeData.profilePic && (
          <img 
            src={resumeData.profilePic} 
            alt="Profile" 
            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mx-auto mb-4 border-4 border-slate-700"
            referrerPolicy="no-referrer"
          />
        )}
        <h1 className="text-xl sm:text-2xl font-bold mb-1 break-words">{resumeData.fullName}</h1>
        <p className="text-slate-400 text-xs sm:text-sm">{resumeData.jobTitle}</p>
      </div>
      
      <div className="space-y-4 text-xs sm:text-sm">
        <h2 className="font-bold border-b border-slate-600 pb-1 uppercase tracking-wider">Contact</h2>
        <div className="space-y-2">
          <p className="break-all">{resumeData.email}</p>
          <p>{resumeData.phone}</p>
          <p className="break-words">{resumeData.location}</p>
          {resumeData.nationality && <p>{resumeData.nationality}</p>}
          {resumeData.idPassport && <p>ID: {resumeData.idPassport}</p>}
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <h2 className="font-bold border-b border-slate-600 pb-1">SKILLS</h2>
        <div className="flex flex-wrap gap-2">
          {resumeData.skills.map((s, i) => (
            <span key={i} className="bg-slate-700 px-2 py-1 rounded text-xs">{s}</span>
          ))}
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <h2 className="font-bold border-b border-slate-600 pb-1">EDUCATION</h2>
        {resumeData.education.map((edu, i) => (
          <div key={i} className="space-y-1">
            <p className="font-bold">{edu.degree}</p>
            <p className="text-slate-400 text-xs">{edu.school}</p>
            <p className="text-slate-400 text-xs">{edu.year}</p>
          </div>
        ))}
      </div>

      {resumeData.references.length > 0 && (
        <div className="space-y-4 text-sm">
          <h2 className="font-bold border-b border-slate-600 pb-1">REFERENCES</h2>
          {resumeData.references.map((ref, i) => (
            <div key={i} className="space-y-0.5">
              <p className="font-bold">{ref.name}</p>
              <p className="text-slate-400 text-xs">{ref.position}</p>
              <p className="text-slate-400 text-xs italic">{ref.contact}</p>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="w-full sm:w-2/3 p-6 sm:p-10 space-y-8 bg-white">
      <section>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
          <div className="w-2 h-6 bg-primary rounded-full" /> ABOUT ME
        </h2>
        <p className="text-xs sm:text-sm leading-relaxed text-slate-600">{resumeData.summary}</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-primary rounded-full" /> EXPERIENCE
        </h2>
        <div className="space-y-6">
          {resumeData.experience.map((exp, i) => (
            <div key={i} className="relative pl-6 border-l-2 border-slate-100">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary" />
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-slate-800">{exp.role}</h3>
                <span className="text-xs font-bold text-primary">{exp.period}</span>
              </div>
              <p className="text-sm font-semibold text-slate-500 mb-2">{exp.company}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
            </div>
          ))}
        </div>
      </section>
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
