-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'doctor')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create patient details table
CREATE TABLE public.patient_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  address TEXT,
  emergency_contact TEXT,
  medical_conditions TEXT[],
  allergies TEXT[],
  current_medications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on patient_details
ALTER TABLE public.patient_details ENABLE ROW LEVEL SECURITY;

-- Create doctor details table
CREATE TABLE public.doctor_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE UNIQUE NOT NULL,
  specialization TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  years_experience INTEGER,
  qualification TEXT,
  hospital_affiliation TEXT,
  consultation_fee DECIMAL(10,2),
  bio TEXT,
  available_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  available_slots TEXT[] DEFAULT ARRAY['09:00-10:00', '10:00-11:00', '14:00-15:00', '15:00-16:00'],
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on doctor_details
ALTER TABLE public.doctor_details ENABLE ROW LEVEL SECURITY;

-- Create chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Medical Consultation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  type TEXT DEFAULT 'consultation' CHECK (type IN ('consultation', 'follow-up', 'emergency')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create medical records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  diagnosis TEXT,
  prescription TEXT,
  record_type TEXT DEFAULT 'consultation' CHECK (record_type IN ('consultation', 'diagnosis', 'prescription', 'chat_summary')),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on medical_records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for patient_details
CREATE POLICY "Patients can view their own details" ON public.patient_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update their own details" ON public.patient_details
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Patients can insert their own details" ON public.patient_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can view patient details for their appointments" ON public.patient_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE doctor_id = auth.uid() AND patient_id = patient_details.user_id
    )
  );

-- Create RLS policies for doctor_details
CREATE POLICY "Doctors can view their own details" ON public.doctor_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own details" ON public.doctor_details
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own details" ON public.doctor_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view available doctors" ON public.doctor_details
  FOR SELECT USING (is_available = true);

-- Create RLS policies for chat_sessions
CREATE POLICY "Patients can view their own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view chat sessions for their patients" ON public.chat_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE doctor_id = auth.uid() AND patient_id = chat_sessions.patient_id
    )
  );

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages from their sessions" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id AND patient_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their sessions" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = chat_messages.session_id AND patient_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view messages from their patients" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      JOIN public.appointments a ON a.patient_id = cs.patient_id
      WHERE cs.id = chat_messages.session_id AND a.doctor_id = auth.uid()
    )
  );

-- Create RLS policies for appointments
CREATE POLICY "Patients can view their own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view their appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = doctor_id);

-- Create RLS policies for medical_records
CREATE POLICY "Patients can view their own medical records" ON public.medical_records
  FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view records for their patients" ON public.medical_records
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create medical records" ON public.medical_records
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "System can create chat summary records" ON public.medical_records
  FOR INSERT WITH CHECK (record_type = 'chat_summary');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_details_updated_at
  BEFORE UPDATE ON public.patient_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_details_updated_at
  BEFORE UPDATE ON public.doctor_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, user_type)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo doctors
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'dr.smith@hospital.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Dr. John Smith", "user_type": "doctor"}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'dr.johnson@clinic.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Dr. Sarah Johnson", "user_type": "doctor"}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'dr.williams@medical.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"full_name": "Dr. Michael Williams", "user_type": "doctor"}');

-- Insert demo doctor details
INSERT INTO public.doctor_details (user_id, specialization, license_number, years_experience, qualification, hospital_affiliation, consultation_fee, bio)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Cardiology', 'MD-CARD-001', 15, 'MD Cardiology, MBBS', 'City General Hospital', 200.00, 'Experienced cardiologist specializing in heart disease prevention and treatment.'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Dermatology', 'MD-DERM-002', 10, 'MD Dermatology, MBBS', 'Skin Care Clinic', 150.00, 'Specialist in skin conditions, cosmetic dermatology, and skin cancer prevention.'),
  ('550e8400-e29b-41d4-a716-446655440003', 'General Medicine', 'MD-GEN-003', 8, 'MBBS, MD Internal Medicine', 'Community Health Center', 100.00, 'General practitioner with expertise in preventive care and chronic disease management.');