import React, { useState, useEffect } from 'react';
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
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    if (user?.id && doctors.length > 0) {
      loadAppointments();
    }
  }, [user?.id, doctors]);

  const loadDoctors = async () => {
    try {
      const { data: doctorDetails, error } = await supabase
        .from('doctor_details')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('is_available', true);

      if (error) throw error;

      const formattedDoctors = doctorDetails?.map(doctor => ({
        id: doctor.user_id,
        name: doctor.profiles?.full_name || 'Dr. Unknown',
        specialization: doctor.specialization,
        image: doctor.profiles?.avatar_url || '',
        availableSlots: doctor.available_slots || ['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00']
      })) || [];

      setDoctors(formattedDoctors);
    } catch (error) {
      console.error('Error loading doctors:', error);
      // Fallback to mock data if no doctors in database
      setDoctors([
        {
          id: 'mock-1',
          name: 'Dr. Sarah Johnson',
          specialization: 'General Medicine',
          availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
        },
        {
          id: 'mock-2',
          name: 'Dr. Michael Chen',
          specialization: 'Cardiology',
          availableSlots: ['10:00 AM', '01:00 PM', '03:00 PM', '05:00 PM']
        }
      ]);
    }
  };

  const loadAppointments = async () => {
    if (!user?.id) return;
    
    try {
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select(`
          *
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Get all doctor details in a single query
      const doctorIds = [...new Set(appointmentsData?.map(apt => apt.doctor_id) || [])];
      const { data: doctorsData } = await supabase
        .from('doctor_details')
        .select('user_id, specialization, profiles:user_id(full_name)')
        .in('user_id', doctorIds);

      // Create a lookup map for faster access
      const doctorLookup = doctorsData?.reduce((acc, doctor) => {
        acc[doctor.user_id] = doctor;
        return acc;
      }, {} as Record<string, any>) || {};

      const formattedAppointments = appointmentsData?.map(apt => {
        const doctor = doctorLookup[apt.doctor_id];
        return {
          id: apt.id,
          doctorName: doctor?.profiles?.full_name || 'Dr. Unknown',
          specialization: doctor?.specialization || 'General Medicine',
          date: apt.appointment_date,
          time: apt.appointment_time,
          status: apt.status
        };
      }) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedDoctor || !selectedSlot) {
      toast({
        title: "Missing Information",
        description: "Please select a doctor, date, and time slot.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: selectedDoctor,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedSlot,
          status: 'scheduled',
          type: 'consultation'
        });

      if (error) throw error;

      // Reset form
      setSelectedDoctor('');
      setSelectedSlot('');

      // Reload appointments
      await loadAppointments();
      
      const doctor = doctors.find(d => d.id === selectedDoctor);
      toast({
        title: "Appointment Booked!",
        description: `Your appointment with ${doctor?.name} on ${selectedDate.toLocaleDateString()} at ${selectedSlot} has been confirmed.`,
      });

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                  disabled={!selectedSlot || isLoading}
                  className="w-full mt-4"
                  variant="medical"
                >
                  {isLoading ? 'Booking...' : 'Book Appointment'}
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