export type ResumeTemplate = 'modern' | 'classic' | 'creative' | 'minimal' | 'executive';

export interface ResumeData {
  fullName: string;
  jobTitle: string;
  profilePic?: string;
  nationality?: string;
  idPassport?: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    period: string;
    description: string;
  }[];
  skills: string[];
  education: {
    school: string;
    degree: string;
    year: string;
  }[];
  references: {
    name: string;
    position: string;
    company: string;
    contact: string;
  }[];
  template: ResumeTemplate;
  font: string;
}
