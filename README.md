# AI Health Companion

A full-stack web application that helps users track their medical history, get AI-powered health recommendations, manage profiles, and schedule doctor appointments.

---

## 🚀 Features
- **User Authentication** – Email/password login & registration using **Supabase Auth**.  
- **AI Recommendations** – Health tips and guidance powered by an AI API (e.g., Gemini or any free alternative).  
- **Medical History** – Stores all past AI recommendations with date and time in **Supabase Database**.  
- **Profile Management** – Users can view and update personal details.  
- **Appointment Scheduling** – Book slots with doctors of different specializations. Shows real-time availability (Busy/Available).  
- **Emergency Contact** – Quick-access emergency button on the Recommendations page.

---

## 🛠 Tech Stack
- **Frontend:** React + Vite + TypeScript  
- **UI:** Tailwind CSS, shadcn-ui components  
- **Backend & Database:** Supabase (PostgreSQL + Auth + Realtime)  
- **AI Integration:** Gemini API (or any free AI API)

---

## 📦 Full Setup Guide

### ✅ Step 1 – Local Project Setup
```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install
```

Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_AI_API_KEY=<optional-ai-api-key>
```

Run the dev server:
```bash
npm run dev
```
The app will run at `http://localhost:5173/`.

---

### ✅ Step 2 – Create Supabase Project
1. Sign up at [https://supabase.com/](https://supabase.com/) (GitHub login recommended).  
2. Click **New Project**, name it `ai-health-companion`, choose a region near you, and set a strong database password.  
3. In **Project Settings → API**, copy:
   * **Project URL** → use for `VITE_SUPABASE_URL`
   * **anon public key** → use for `VITE_SUPABASE_ANON_KEY`

---

### ✅ Step 3 – Database Schema
Open **SQL Editor** in Supabase and run:
```sql
-- Extra user info
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  created_at timestamp with time zone default now()
);

-- AI recommendations history
create table medical_history (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  recommendation text,
  created_at timestamp with time zone default now()
);

-- Appointment scheduling
create table appointments (
  id bigserial primary key,
  user_id uuid references auth.users on delete cascade,
  doctor_type text,
  appointment_date date,
  appointment_time time,
  status text default 'Available'
);
```

Enable **Row Level Security** on each table and add policies:
```sql
create policy "insert own history"
on medical_history
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "select own history"
on medical_history
for select
to authenticated
using (auth.uid() = user_id);

-- Repeat similar policies for profiles and appointments
```

---

### ✅ Step 4 – Connect Supabase to React
Install the client:
```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabaseClient.ts`:
```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```
Import `supabase` anywhere in your app to handle authentication, CRUD operations, and realtime updates.

---

### ✅ Step 5 – Core Feature Implementation

**Authentication**
```ts
// Sign Up
await supabase.auth.signUp({ email, password });

// Sign In
await supabase.auth.signInWithPassword({ email, password });
```

**Save AI Recommendation**
```ts
await supabase.from('medical_history').insert({
  user_id: user.id,
  recommendation: aiResponse
});
```

**Book Appointment**
```ts
await supabase.from('appointments').insert({
  user_id: user.id,
  doctor_type: 'Cardiologist',
  appointment_date: '2025-09-05',
  appointment_time: '10:30',
  status: 'Busy'
});
```

**Fetch Available Slots**
```ts
const { data: slots } = await supabase
  .from('appointments')
  .select('*')
  .eq('doctor_type', 'Cardiologist')
  .eq('status', 'Available');
```

---

## 🗂 Suggested Project Structure
```
src/
  components/      # Reusable UI components
  pages/           # Page components (Login, Profile, etc.)
  hooks/           # Custom React hooks
  lib/             # Supabase client, API helpers
  styles/          # Tailwind styles
```

---

## 🌐 Deployment
1. Build production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder to **Vercel**, **Netlify**, or **GitHub Pages**.  
   (Supabase backend is hosted automatically—no extra deployment needed.)

---

## ⚠️ Disclaimer
The AI Health Companion provides general health information **for educational purposes only**.  
Always consult a licensed medical professional for diagnosis or treatment.

---

## 📜 License
MIT License – free to use and modify.
