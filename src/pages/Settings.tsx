import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Shield, User, Zap, Loader2 } from 'lucide-react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from 'sonner';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

export default function Settings() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: userData?.display_name || '',
    email: userData?.email || ''
  });
  const [emailError, setEmailError] = useState('');

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
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        display_name: profileData.displayName,
        email: profileData.email
      });
      
      toast.success('Profile updated!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { plan: 'free' });
      
      toast.success('Your plan has been downgraded to Free.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('Failed to downgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const onPayPalApprove = async (data: any, actions: any) => {
    if (!user) return;
    try {
      const details = await actions.order.capture();
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { plan: 'pro' });
      
      toast.success(`Welcome to ApplyAI Pro, ${details.payer.name.given_name}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast.error('Failed to upgrade plan');
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
