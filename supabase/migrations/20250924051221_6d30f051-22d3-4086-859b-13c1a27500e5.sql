-- Allow patients to view doctor profiles for appointment booking
CREATE POLICY "Users can view doctor profiles" 
ON public.profiles 
FOR SELECT 
USING (
  user_type = 'doctor' OR auth.uid() = user_id
);