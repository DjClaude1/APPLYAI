import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Loader2, Users, Briefcase, FileText, ShieldCheck, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userData?.role !== 'admin') return;
    fetchData();
  }, [userData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, resumesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('resumes').select('*, profiles(display_name, email)').order('updated_at', { ascending: false })
      ]);

      if (usersRes.error) throw usersRes.error;
      if (resumesRes.error) throw resumesRes.error;

      setUsers(usersRes.data || []);
      setResumes(resumesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = async (userId: string, currentPlan: string) => {
    const newPlan = currentPlan === 'pro' ? 'free' : 'pro';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan })
        .eq('id', userId);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
      toast.success(`User plan updated to ${newPlan}`);
    } catch (error: any) {
      toast.error('Failed to update plan');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredResumes = resumes.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (userData?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} /> Admin Control Center
          </h1>
          <p className="text-muted-foreground">Manage users, subscriptions, and platform health.</p>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2 flex items-center gap-3">
            <Users className="text-blue-500" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Users</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
          </Card>
          <Card className="px-4 py-2 flex items-center gap-3">
            <FileText className="text-purple-500" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Resumes</p>
              <p className="text-xl font-bold">{resumes.length}</p>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2"><Users size={16} /> Users</TabsTrigger>
            <TabsTrigger value="resumes" className="gap-2"><FileText size={16} /> Resumes</TabsTrigger>
          </TabsList>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all registered users.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-primary" size={48} />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.display_name || 'Anonymous'}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.plan === 'pro' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                              {user.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'outline' : 'ghost'} className={user.role === 'admin' ? 'border-primary text-primary' : ''}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><FileText size={12} /> {user.resume_count}</span>
                              <span className="flex items-center gap-1"><Briefcase size={12} /> {user.application_count}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => togglePlan(user.id, user.plan)}
                              disabled={user.role === 'admin'}
                            >
                              {user.plan === 'pro' ? 'Downgrade' : 'Upgrade'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumes">
          <Card>
            <CardHeader>
              <CardTitle>Global Resumes</CardTitle>
              <CardDescription>View all resumes created on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-primary" size={48} />
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resume Title</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResumes.map((resume) => (
                        <TableRow key={resume.id}>
                          <TableCell className="font-medium">{resume.title || 'Untitled Resume'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{resume.profiles?.display_name || 'Anonymous'}</span>
                              <span className="text-xs text-muted-foreground">{resume.profiles?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{resume.content?.template || 'modern'}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(resume.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => window.open(`/resume/${resume.id}`, '_blank')}
                            >
                              View Public
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
