import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Users, Bot, ArrowRight, Heart, Shield, Clock } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import PatientDashboard from '@/components/PatientDashboard';
import DoctorDashboard from '@/components/DoctorDashboard';
import { supabase } from '@/integrations/supabase/client';
import heroMedical from '../assets/hero-medical.jpg';
import consultationImage from '../assets/consultation.jpg';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'patient-dashboard' | 'doctor-dashboard'>('landing');
  const [selectedUserType, setSelectedUserType] = useState<'patient' | 'doctor'>('patient');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setCurrentView('landing');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setCurrentUser({ ...profile, id: userId });
      setCurrentView(profile.user_type === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleRoleSelection = (userType: 'patient' | 'doctor') => {
    setSelectedUserType(userType);
    setCurrentView('auth');
  };

  const handleLogin = async (userData: any) => {
    // The auth state change will handle the redirect automatically
    console.log('Login successful for:', userData.email);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setCurrentView('landing');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (currentView === 'auth') {
    return (
      <AuthForm
        userType={selectedUserType}
        onBack={() => setCurrentView('landing')}
        onLogin={handleLogin}
      />
    );
  }

  if (currentView === 'patient-dashboard' && currentUser) {
    return <PatientDashboard user={currentUser} onLogout={handleLogout} />;
  }

  if (currentView === 'doctor-dashboard' && currentUser) {
    return <DoctorDashboard user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0">
          <img
            src={heroMedical}
            alt="Medical AI Technology"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="text-center text-white space-y-8">
            <div className="flex justify-center mb-6">
              <Bot className="h-16 w-16" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold">
              AI Health Companion
            </h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
              Your intelligent medicine recommendation system with AI-powered consultations, 
              connecting patients with professional doctors for comprehensive healthcare.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              <Badge variant="secondary" className="bg-white/20 text-white text-lg px-4 py-2">
                <Heart className="h-4 w-4 mr-2" />
                AI-Powered Medicine Recommendations
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white text-lg px-4 py-2">
                <Shield className="h-4 w-4 mr-2" />
                Professional Doctor Consultations
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white text-lg px-4 py-2">
                <Clock className="h-4 w-4 mr-2" />
                24/7 Health Support
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Access Portal</h2>
            <p className="text-xl text-muted-foreground">
              Select your role to access personalized healthcare services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Patient Portal */}
            <Card className="shadow-medical hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 mx-auto mb-6 bg-primary-light rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Users className="h-12 w-12 text-primary group-hover:text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Patient Portal</CardTitle>
                <CardDescription className="text-lg">
                  Access your AI health companion for personalized medical guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <ul className="space-y-3 text-left max-w-sm mx-auto">
                  <li className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>AI-powered medicine recommendations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-primary" />
                    <span>Medical history tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Schedule doctor appointments</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Personal health profile</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handleRoleSelection('patient')}
                  className="w-full mt-6 text-lg py-6"
                  variant="medical"
                >
                  Access Patient Portal
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Doctor Portal */}
            <Card className="shadow-medical hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary cursor-pointer group">
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 mx-auto mb-6 bg-secondary-light rounded-full flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                  <Stethoscope className="h-12 w-12 text-secondary group-hover:text-white" />
                </div>
                <CardTitle className="text-2xl mb-2">Doctor Portal</CardTitle>
                <CardDescription className="text-lg">
                  Professional dashboard for patient consultation and management
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <ul className="space-y-3 text-left max-w-sm mx-auto">
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-secondary" />
                    <span>Patient profile management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-secondary" />
                    <span>Medical history access</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-secondary" />
                    <span>Appointment scheduling</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Stethoscope className="h-5 w-5 text-secondary" />
                    <span>Professional consultation tools</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => handleRoleSelection('doctor')}
                  className="w-full mt-6 text-lg py-6"
                  variant="secondary"
                >
                  Access Doctor Portal
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Healthcare Features</h2>
            <p className="text-xl text-muted-foreground">
              Cutting-edge AI technology meets professional medical expertise
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={consultationImage}
                alt="Medical Consultation"
                className="rounded-lg shadow-card-custom"
              />
            </div>
            <div className="space-y-6">
              <Card className="shadow-card-custom">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">AI-Powered Recommendations</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Get intelligent medicine recommendations powered by Gemini AI, 
                    providing accurate guidance for your health concerns.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card-custom">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-secondary-light rounded-full flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-secondary" />
                    </div>
                    <h3 className="text-xl font-semibold">Professional Consultations</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Connect with certified doctors for professional medical advice, 
                    diagnosis, and treatment plans through our secure platform.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card-custom">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Comprehensive Health Tracking</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Track your medical history, monitor symptoms, and maintain 
                    a complete health profile for better care coordination.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-medical text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-6">
            <Bot className="h-12 w-12" />
          </div>
          <h3 className="text-2xl font-bold mb-4">AI Health Companion</h3>
          <p className="opacity-90 max-w-2xl mx-auto">
            Revolutionizing healthcare through artificial intelligence and professional medical expertise. 
            Your health, our priority.
          </p>
          <p className="mt-6 text-sm opacity-70">
            © 2024 AI Health Companion. Professional medical guidance at your fingertips.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;