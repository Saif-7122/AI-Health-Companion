import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, User, CheckCircle, XCircle, Calendar as CalendarIcon, Video, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  type: 'consultation';
  notes?: string;
}

interface DoctorAppointmentsProps {
  user?: any;
}

const DoctorAppointments: React.FC<DoctorAppointmentsProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id]);

  const loadAppointments = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:profiles!patient_id(
            full_name,
            email
          )
        `)
        .eq('doctor_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const formattedAppointments = appointmentsData?.map(apt => ({
        id: apt.id,
        patientName: apt.patient?.full_name || 'Unknown Patient',
        patientEmail: apt.patient?.email || '',
        date: apt.appointment_date,
        time: apt.appointment_time,
        status: apt.status as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show',
        type: 'consultation' as const,
        notes: apt.notes
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'confirmed':
        return 'bg-medical-blue text-white';
      case 'completed':
        return 'bg-medical-green text-white';
      case 'cancelled':
        return 'bg-medical-error text-white';
      case 'no-show':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      
      toast({
        title: "Appointment Updated",
        description: `Appointment status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive"
      });
    }
  };

  const filterAppointmentsByDate = (filterDate: string) => {
    return appointments.filter(apt => apt.date === filterDate);
  };

  const todayAppointments = filterAppointmentsByDate(new Date().toISOString().split('T')[0]);
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) > new Date() && (apt.status === 'confirmed' || apt.status === 'pending')
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom">
        <CardHeader className="bg-primary-light">
          <CardTitle className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Appointment Management
          </CardTitle>
          <CardDescription>
            Manage your scheduled consultations and patient appointments
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Confirmations */}
        {pendingAppointments.length > 0 && (
          <Card className="lg:col-span-3 shadow-card-custom border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-lg text-yellow-800">Pending Confirmations</CardTitle>
              <CardDescription className="text-yellow-700">
                New appointment requests requiring your confirmation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {pendingAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 rounded-lg border bg-yellow-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {appointment.patientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{appointment.patientName}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.patientEmail}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {appointment.time}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Appointments */}
        <Card className="lg:col-span-2 shadow-card-custom">
          <CardHeader>
            <CardTitle className="text-lg">Today's Appointments</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {appointment.patientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{appointment.patientName}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.patientEmail}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {appointment.type}
                      </div>
                    </div>

                    {appointment.status === 'confirmed' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(appointment.id, 'completed')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 p-2 bg-background rounded text-sm">
                      <strong>Notes:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
              ))}

              {todayAppointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments scheduled for today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming</CardTitle>
            <CardDescription>Next scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{appointment.patientName}</h4>
                    <Badge variant="outline" className="text-xs">
                      {appointment.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment.time}
                    </div>
                  </div>
                </div>
              ))}

              {upcomingAppointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming appointments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-3 shadow-card-custom">
          <CardHeader>
            <CardTitle className="text-lg">Appointment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {appointments.filter(apt => apt.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {appointments.filter(apt => apt.status === 'confirmed').length}
                </div>
                <div className="text-sm text-muted-foreground">Confirmed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-medical-green">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-medical-warning">
                  {todayAppointments.length}
                </div>
                <div className="text-sm text-muted-foreground">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {upcomingAppointments.length}
                </div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorAppointments;