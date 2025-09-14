import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, History, User, Calendar, Send, Bot, Stethoscope } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ChatInterface from './ChatInterface';
import MedicalHistory from './MedicalHistory';
import PatientProfile from './PatientProfile';
import AppointmentScheduler from './AppointmentScheduler';

interface PatientDashboardProps {
  user: any;
  onLogout: () => void;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-medical text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Bot className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">AI Health Companion</h1>
                <p className="text-sm opacity-90">Your Personal Medical Assistant</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Logout
            </Button>
            <div className="text-right">
              <p className="font-medium">{user.full_name || user.name || 'User'}</p>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Patient
              </Badge>
            </div>
            <Avatar>
              <AvatarImage src={user.avatar_url || ""} />
              <AvatarFallback className="bg-white/20 text-white">
                {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Medical History
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <ChatInterface user={user} />
          </TabsContent>

          <TabsContent value="history">
            <MedicalHistory user={user} />
          </TabsContent>

          <TabsContent value="profile">
            <PatientProfile user={user} />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentScheduler user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboard;