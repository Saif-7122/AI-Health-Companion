import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, History, Calendar, Stethoscope, FileText } from 'lucide-react';
import DoctorPatients from './DoctorPatients';
import DoctorAppointments from './DoctorAppointments';

interface DoctorDashboardProps {
  user: any;
  onLogout: () => void;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('patients');

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
              <Stethoscope className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">Doctor Portal</h1>
                <p className="text-sm opacity-90">Professional Consultation Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">Dr. {user.name}</p>
              <p className="text-sm opacity-90">{user.specialization || 'General Medicine'}</p>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Doctor
              </Badge>
            </div>
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-white/20 text-white">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Patient Profiles
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Medical Records
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <DoctorPatients />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  Patient Medical Records
                </CardTitle>
                <CardDescription>
                  Access and review patient medical histories and AI consultation logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a patient to view their medical history</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <DoctorAppointments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorDashboard;