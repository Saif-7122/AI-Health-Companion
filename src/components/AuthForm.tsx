import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Stethoscope, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthFormProps {
  onBack: () => void;
  userType: 'patient' | 'doctor';
  onLogin: (userData: any) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onBack, userType, onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    specialization: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (isLogin: boolean) => {
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (data.user) {
          // Fetch user profile to determine user type and other details
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });

          onLogin({
            id: data.user.id,
            email: data.user.email,
            name: profile?.full_name || 'User',
            userType: profile?.user_type || userType,
          });
        }
      } else {
        // Sign up
        if (!formData.name) {
          toast({
            title: "Error",
            description: "Please enter your full name",
            variant: "destructive"
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.name,
              user_type: userType,
              phone: formData.phone,
              ...(userType === 'doctor' && {
                specialization: formData.specialization,
                license_number: formData.licenseNumber
              })
            }
          }
        });

        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        if (data.user) {
          // Create additional details based on user type
          if (userType === 'doctor' && formData.specialization && formData.licenseNumber) {
            await supabase.from('doctor_details').insert({
              user_id: data.user.id,
              specialization: formData.specialization,
              license_number: formData.licenseNumber,
            });
          }

          if (userType === 'patient') {
            await supabase.from('patient_details').insert({
              user_id: data.user.id,
            });
          }

          toast({
            title: "Account Created",
            description: "Please check your email to verify your account.",
          });

          // If user is already confirmed (in development), log them in
          if (data.session) {
            onLogin({
              id: data.user.id,
              email: data.user.email,
              name: formData.name,
              userType: userType,
            });
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-medical">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="absolute left-4 top-4 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex justify-center mb-4">
            {userType === 'patient' ? (
              <Users className="h-12 w-12 text-primary" />
            ) : (
              <Stethoscope className="h-12 w-12 text-secondary" />
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {userType === 'patient' ? 'Patient' : 'Doctor'} Portal
          </CardTitle>
          <CardDescription>
            Access your {userType === 'patient' ? 'health companion' : 'consultation dashboard'}
          </CardDescription>
          
          <Badge variant={userType === 'patient' ? 'default' : 'secondary'} className="w-fit mx-auto">
            {userType === 'patient' ? 'Patient Access' : 'Medical Professional'}
          </Badge>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                />
              </div>
              <Button 
                onClick={() => handleSubmit(true)} 
                className="w-full" 
                variant={userType === 'patient' ? 'default' : 'secondary'}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Login'}
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
              
              {userType === 'doctor' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      placeholder="e.g., General Medicine, Cardiology"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="Medical license number"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                />
              </div>
              <Button 
                onClick={() => handleSubmit(false)} 
                className="w-full"
                variant={userType === 'patient' ? 'default' : 'secondary'}
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;