import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Clock, Stethoscope, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  image?: string;
  availableSlots: string[];
}

interface AppointmentSchedulerProps {
  user: any;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const { toast } = useToast();

  // Mock doctors data
  const doctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialization: 'General Medicine',
      availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialization: 'Cardiology',
      availableSlots: ['10:00 AM', '01:00 PM', '03:00 PM', '05:00 PM']
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialization: 'Dermatology',
      availableSlots: ['09:30 AM', '11:30 AM', '02:30 PM', '04:30 PM']
    },
    {
      id: '4',
      name: 'Dr. James Wilson',
      specialization: 'Orthopedics',
      availableSlots: ['08:00 AM', '12:00 PM', '03:30 PM', '05:30 PM']
    }
  ];

  const [appointments, setAppointments] = useState([
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      date: '2024-01-20',
      time: '10:00 AM',
      status: 'confirmed',
      specialization: 'General Medicine'
    }
  ]);

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedDoctor || !selectedSlot) {
      toast({
        title: "Missing Information",
        description: "Please select a doctor, date, and time slot.",
        variant: "destructive"
      });
      return;
    }

    const doctor = doctors.find(d => d.id === selectedDoctor);
    if (!doctor) return;

    const newAppointment = {
      id: Date.now().toString(),
      doctorName: doctor.name,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedSlot,
      status: 'confirmed',
      specialization: doctor.specialization
    };

    setAppointments(prev => [...prev, newAppointment]);
    
    toast({
      title: "Appointment Booked!",
      description: `Your appointment with ${doctor.name} on ${selectedDate.toLocaleDateString()} at ${selectedSlot} has been confirmed.`,
    });

    // Reset form
    setSelectedDoctor('');
    setSelectedSlot('');
  };

  const getSelectedDoctor = () => {
    return doctors.find(d => d.id === selectedDoctor);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom">
        <CardHeader className="bg-secondary-light">
          <CardTitle className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-secondary" />
            Schedule Appointment
          </CardTitle>
          <CardDescription>
            Book online consultations with our registered doctors
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Form */}
        <div className="space-y-6">
          {/* Date Selection */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="text-lg">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0} // Disable past dates and Sundays
                className={cn("rounded-md border pointer-events-auto")}
              />
            </CardContent>
          </Card>

          {/* Doctor Selection */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="text-lg">Select Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <div className="space-y-3">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted">
                      <RadioGroupItem value={doctor.id} id={doctor.id} />
                      <div className="flex items-center space-x-3 flex-1">
                        <Avatar>
                          <AvatarImage src={doctor.image} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            <Stethoscope className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Label htmlFor={doctor.id} className="font-medium cursor-pointer">
                            {doctor.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{doctor.availableSlots.length} slots</Badge>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          {selectedDoctor && (
            <Card className="shadow-card-custom">
              <CardHeader>
                <CardTitle className="text-lg">Available Time Slots</CardTitle>
                <CardDescription>
                  {getSelectedDoctor()?.name} - {selectedDate?.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedSlot} onValueChange={setSelectedSlot}>
                  <div className="grid grid-cols-2 gap-3">
                    {getSelectedDoctor()?.availableSlots.map((slot) => (
                      <div key={slot} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted">
                        <RadioGroupItem value={slot} id={slot} />
                        <Label htmlFor={slot} className="flex items-center gap-2 cursor-pointer flex-1">
                          <Clock className="h-4 w-4" />
                          {slot}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <Button 
                  onClick={handleBookAppointment}
                  disabled={!selectedSlot}
                  className="w-full mt-4"
                  variant="medical"
                >
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Appointments */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="text-lg">Your Appointments</CardTitle>
            <CardDescription>Upcoming and confirmed appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{appointment.doctorName}</h4>
                    <Badge className="bg-medical-green text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {appointment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{appointment.specialization}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(appointment.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {appointment.time}
                    </div>
                  </div>
                </div>
              ))}

              {appointments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments scheduled</p>
                  <p className="text-sm">Book your first appointment to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentScheduler;