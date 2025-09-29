import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Search, Eye, MessageCircle, Clock, Phone, Mail } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  bloodGroup: string;
  lastConsultation: Date;
  status: 'active' | 'follow-up' | 'new';
  totalConsultations: number;
}

interface DoctorPatientsProps {
  user: any;
}

const DoctorPatients: React.FC<DoctorPatientsProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      // Get patients who have appointments with this doctor
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          created_at,
          patient_profile:profiles!patient_id (
            user_id,
            full_name,
            email,
            phone
          ),
          patient_details!patient_id (
            date_of_birth,
            blood_group
          )
        `)
        .eq('doctor_id', user?.id);

      if (appointmentsError) {
        console.error('Error loading patients:', appointmentsError);
        return;
      }

      // Transform data to match Patient interface
      const uniquePatients = new Map();
      
      appointments?.forEach((appointment: any) => {
        const profile = appointment.patient_profile;
        const details = appointment.patient_details;
        
        if (profile && !uniquePatients.has(profile.user_id)) {
          const birthDate = details?.date_of_birth ? new Date(details.date_of_birth) : null;
          const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 0;
          
          uniquePatients.set(profile.user_id, {
            id: profile.user_id,
            name: profile.full_name || 'Unknown',
            email: profile.email || '',
            phone: profile.phone || '',
            age: age,
            bloodGroup: details?.blood_group || 'Unknown',
            lastConsultation: new Date(appointment.created_at),
            status: 'active',
            totalConsultations: 1
          });
        }
      });

      setPatients(Array.from(uniquePatients.values()));
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-medical-green text-white';
      case 'follow-up':
        return 'bg-medical-warning text-black';
      case 'new':
        return 'bg-medical-blue text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const viewPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom">
        <CardHeader className="bg-secondary-light">
          <CardTitle className="flex items-center gap-3">
            <Users className="h-6 w-6 text-secondary" />
            Patient Management
          </CardTitle>
          <CardDescription>
            View and manage your patient profiles and consultation history
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <Card className="shadow-card-custom">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Patients Grid */}
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="shadow-card-custom hover:shadow-medical transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{patient.name}</h3>
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {patient.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {patient.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Age: {patient.age}</span>
                          <span>Blood Group: {patient.bloodGroup}</span>
                          <span>Consultations: {patient.totalConsultations}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="medical-outline"
                        size="sm"
                        onClick={() => viewPatientDetails(patient)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Last: {patient.lastConsultation.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPatients.length === 0 && !loading && (
              <Card className="shadow-card-custom">
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Patients Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'No patients have scheduled appointments yet'}
                  </p>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="shadow-card-custom">
                <CardContent className="text-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading patients...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Patient Details Sidebar */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="text-lg">Patient Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium text-lg">{selectedPatient.name}</h3>
                  <Badge className={getStatusColor(selectedPatient.status)}>
                    {selectedPatient.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {selectedPatient.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {selectedPatient.phone}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Medical Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>Age: {selectedPatient.age} years</div>
                      <div>Blood Group: {selectedPatient.bloodGroup}</div>
                      <div>Total Consultations: {selectedPatient.totalConsultations}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last consultation: {selectedPatient.lastConsultation.toLocaleDateString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button variant="medical" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      View Chat History
                    </Button>
                    <Button variant="medical-outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Medical Records
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a patient to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorPatients;