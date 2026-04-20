import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Shield, User, Zap, Loader2, Bell, BellRing, Trash2, Plus } from 'lucide-react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export default function Settings() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [jobAlerts, setJobAlerts] = useState<any[]>([]);
  const [newAlert, setNewAlert] = useState({ keywords: '', location: '' });
  const [profileData, setProfileData] = useState({
    displayName: userData?.display_name || '',
    email: userData?.email || ''
  });

  const [emailError, setEmailError] = useState('');

  React.useEffect(() => {
    if (user) {
      fetchJobAlerts();
    }
  }, [user]);

  const fetchJobAlerts = async () => {
    setAlertsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('uid', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobAlerts(data || []);
    } catch (error: any) {
      console.error('Fetch Alerts Error:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  const addJobAlert = async () => {
    if (!user || !newAlert.keywords || !newAlert.location) {
      toast.error('Please fill in both keywords and location');
      return;
    }
    
    setAlertsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_alerts')
        .insert({
          uid: user.id,
          keywords: newAlert.keywords,
          location: newAlert.location
        })
        .select()
        .single();

      if (error) throw error;
      setJobAlerts(prev => [data, ...prev]);
      setNewAlert({ keywords: '', location: '' });
      toast.success('Job alert created!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create alert');
    } finally {
      setAlertsLoading(false);
    }
  };

  const deleteJobAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setJobAlerts(prev => prev.filter(a => a.id !== id));
      toast.success('Alert deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete alert');
    }
  };

  const toggleAlertStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setJobAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a));
      toast.success(currentStatus ? 'Alert paused' : 'Alert resumed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update alert');
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const saveProfile = async () => {
    if (!user || emailError) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.displayName,
          email: profileData.email
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated!');
    } catch (error: any) {
      console.error('Update Error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'free' })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Your plan has been downgraded to Free.');
    } catch (error: any) {
      console.error('Downgrade Error:', error);
      toast.error(error.message || 'Failed to downgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const onPayPalApprove = async (data: any, actions: any) => {
    if (!user) return;
    try {
      const details = await actions.order.capture();
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Welcome to ApplyAI Pro, ${details.payer.name.given_name}!`);
    } catch (error: any) {
      console.error('Upgrade Error:', error);
      toast.error(error.message || 'Failed to upgrade plan');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="grid gap-8">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} className="text-primary" /> Profile Information
            </CardTitle>
            <CardDescription>Manage your account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  name="displayName"
                  value={profileData.displayName} 
                  onChange={handleProfileChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  name="email"
                  type="email"
                  value={profileData.email} 
                  onChange={handleProfileChange}
                  className={emailError ? 'border-destructive' : ''}
                />
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveProfile} disabled={loading || !!emailError}>
                {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card className={userData?.plan === 'pro' ? 'border-primary' : ''}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap size={20} className="text-primary" /> Subscription Plan
                </CardTitle>
                <CardDescription>Manage your billing and plan limits.</CardDescription>
              </div>
              <Badge variant={userData?.plan === 'pro' ? 'default' : 'secondary'} className="uppercase">
                {userData?.plan || 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {userData?.plan === 'pro' ? (
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 flex items-center gap-3">
                  <CheckCircle2 className="text-primary" />
                  <p className="font-medium">You are currently on the Pro plan. Enjoy unlimited access!</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDowngrade} 
                  disabled={loading}
                  className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Downgrade to Free Plan
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-bold mb-2">Free Plan</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li>• 1 AI Resume</li>
                      <li>• 3 Job Applications</li>
                      <li>• Standard Templates</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-primary/50 rounded-lg bg-primary/5">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      Pro Plan <Badge size="sm">Recommended</Badge>
                    </h4>
                    <ul className="text-sm space-y-2">
                      <li>• Unlimited Resumes</li>
                      <li>• Unlimited Applications</li>
                      <li>• Priority AI Support</li>
                      <li>• No Watermarks</li>
                    </ul>
                    <p className="mt-4 font-bold text-lg">$9/month</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <PayPalButtons 
                    style={{ layout: "vertical" }} 
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          amount: {
                            currency_code: "USD",
                            value: "9.00",
                          },
                          description: "ApplyAI Pro Subscription"
                        }],
                      });
                    }}
                    onApprove={onPayPalApprove}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} className="text-primary" /> Job Alerts
            </CardTitle>
            <CardDescription>Get notified when jobs matching your criteria are found.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex-1 space-y-2">
                <Label>Keywords (e.g. Senior React Developer)</Label>
                <Input 
                  placeholder="Software Engineer..." 
                  value={newAlert.keywords}
                  onChange={(e) => setNewAlert({ ...newAlert, keywords: e.target.value })}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Location</Label>
                <Input 
                  placeholder="Remote, NY, San Francisco..." 
                  value={newAlert.location}
                  onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full md:w-auto gap-2" onClick={addJobAlert} disabled={alertsLoading}>
                  <Plus size={18} /> Create Alert
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BellRing size={14} /> My Active Alerts
              </h4>
              {jobAlerts.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No job alerts set up yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {jobAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                      <div>
                        <p className="font-bold">{alert.keywords}</p>
                        <p className="text-sm text-muted-foreground">{alert.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={alert.is_active ? "text-primary" : "text-muted-foreground"}
                          onClick={() => toggleAlertStatus(alert.id, alert.is_active)}
                        >
                          {alert.is_active ? "Active" : "Paused"}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteJobAlert(alert.id)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} className="text-primary" /> Security
            </CardTitle>
            <CardDescription>Manage your security preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
