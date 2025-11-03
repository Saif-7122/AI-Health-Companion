import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId } = await req.json();
    
    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not found in environment variables');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing AI chat request for user:', userId);

    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          patient_id: userId,
          title: `Medical Chat - ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw new Error('Failed to create chat session');
      }

      currentSessionId = newSession.id;
    }

    // Save user message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'user',
        content: message
      });

    if (messageError) {
      console.error('Error saving user message:', messageError);
      throw new Error('Failed to save user message');
    }

    // Prepare the prompt for medical AI
    const systemPrompt = `You are an AI Health Assistant providing comprehensive medical guidance with practical recommendations.

RESPONSE REQUIREMENTS:
- Keep responses between 60-90 words for detailed guidance
- Include basic medication or remedy suggestions when appropriate
- Provide actionable medical advice and lifestyle recommendations
- Mention common over-the-counter medications when relevant (e.g., ibuprofen for pain, acetaminophen for fever)
- Include home remedies and preventive measures
- Be specific about dosages when mentioning common medications
- Always recommend consulting a healthcare provider for serious symptoms

FORMAT:
- Acknowledge their concern with empathy
- Provide detailed explanation of the condition/symptoms (20-30 words)
- Suggest specific treatments or medications (20-30 words)
- Include lifestyle or home remedy advice (10-20 words)
- End with professional consultation reminder when needed (10-15 words)

EXAMPLES:
- For headaches: "Consider ibuprofen 200-400mg every 6-8 hours, stay hydrated, rest in dark room"
- For cold symptoms: "Try acetaminophen for fever, throat lozenges, warm saltwater gargle, plenty of fluids"
- For minor cuts: "Clean with antiseptic, apply antibiotic ointment like Neosporin, cover with bandage"

User's message: ${message}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const aiResponseText = aiData.choices?.[0]?.message?.content || 
                          'I apologize, but I encountered an issue generating a response. Please try again or consult with a healthcare professional for medical advice.';

    // Save AI response
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: aiResponseText
      });

    if (aiMessageError) {
      console.error('Error saving AI message:', aiMessageError);
      throw new Error('Failed to save AI response');
    }

    // Create medical record entry for this chat
    const { error: recordError } = await supabase
      .from('medical_records')
      .insert({
        patient_id: userId,
        chat_session_id: currentSessionId,
        title: 'AI Health Consultation',
        description: `User inquiry: ${message.substring(0, 100)}...`,
        record_type: 'chat_summary'
      });

    if (recordError) {
      console.error('Error creating medical record:', recordError);
      // Don't throw error here as the chat functionality is more important
    }

    return new Response(JSON.stringify({ 
      response: aiResponseText,
      sessionId: currentSessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});