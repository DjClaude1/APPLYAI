import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Briefcase, Calendar, MapPin, MoreVertical, ExternalLink, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { toast } from 'sonner';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: 'applied' | 'interview' | 'rejected' | 'offered';
  appliedAt: string;
}

export default function Applications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const path = 'applications';
    const q = query(collection(db, path), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(apps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'applications', id));
      await updateDoc(doc(db, 'users', user.uid), {
        applicationCount: increment(-1)
      });
      toast.success('Application removed.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove application.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-500/10 text-blue-500 border-blue-200';
      case 'interview': return 'bg-purple-500/10 text-purple-500 border-purple-200';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-200';
      case 'offered': return 'bg-green-500/10 text-green-500 border-green-200';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Tracker</h1>
          <p className="text-muted-foreground">Keep track of every job you've applied to.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading applications...</div>
          ) : applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Job Title</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Company</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date Applied</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4 align-middle font-medium">{app.jobTitle}</td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-muted-foreground" />
                          {app.company}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar size={14} />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className={getStatusColor(app.status)}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(app.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center">
              <Briefcase className="mx-auto text-muted-foreground mb-4 opacity-20" size={64} />
              <h3 className="text-xl font-bold mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-6">Start applying to jobs to see them here.</p>
              <Button onClick={() => window.location.href = '/job-search'}>Find Jobs</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
