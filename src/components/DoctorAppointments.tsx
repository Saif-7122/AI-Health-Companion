import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, User, CheckCircle, XCircle, Calendar as CalendarIcon, Video, Phone } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'online' | 'phone';
  notes?: string;
}

const DoctorAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  // Mock appointments data
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      patientName: 'John Smith',
      patientEmail: 'john.smith@email.com',
      date: '2024-01-20',
      time: '09:00 AM',
      status: 'scheduled',
      type: 'online'
    },
    {
      id: '2',
      patientName: 'Sarah Johnson',
      patientEmail: 'sarah.j@email.com',
      date: '2024-01-20',
      time: '11:00 AM',
      status: 'scheduled',
      type: 'phone'
    },
    {
      id: '3',
      patientName: 'Michael Brown',
      patientEmail: 'michael.brown@email.com',
      date: '2024-01-19',
      time: '02:00 PM',
      status: 'completed',
      type: 'online',
      notes: 'Follow-up required in 2 weeks'
    },
    {
      id: '4',
      patientName: 'Emily Davis',
      patientEmail: 'emily.davis@email.com',
      date: '2024-01-21',
      time: '10:00 AM',
      status: 'scheduled',
      type: 'online'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
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

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
    
    toast({
      title: "Appointment Updated",
      description: `Appointment status changed to ${newStatus}`,
    });
  };

  const filterAppointmentsByDate = (filterDate: string) => {
    return appointments.filter(apt => apt.date === filterDate);
  };

  const todayAppointments = filterAppointmentsByDate(new Date().toISOString().split('T')[0]);
  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) > new Date() && apt.status === 'scheduled'
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
                        {appointment.type === 'online' ? (
                          <Video className="h-3 w-3" />
                        ) : (
                          <Phone className="h-3 w-3" />
                        )}
                        {appointment.type}
                      </div>
                    </div>

                    {appointment.status === 'scheduled' && (
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {appointments.filter(apt => apt.status === 'scheduled').length}
                </div>
                <div className="text-sm text-muted-foreground">Scheduled</div>
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