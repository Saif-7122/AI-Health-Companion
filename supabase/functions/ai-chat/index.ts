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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
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
    const systemPrompt = `You are an AI Health Assistant. Be CONCISE and DIRECT in your responses.

GUIDELINES:
- Keep responses under 100 words when possible
- Provide clear, actionable advice
- Always mention consulting a healthcare professional for serious concerns
- Be empathetic but brief
- Use simple language, avoid medical jargon
- Focus on the most important information first

FORMAT:
- Start with direct answer/advice
- Add 1-2 key points maximum
- End with professional consultation reminder if needed
- Use bullet points only when essential

User's message: ${message}`;

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');

    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'I apologize, but I encountered an issue generating a response. Please try again or consult with a healthcare professional for medical advice.';

    // Save AI response
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: aiResponse
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
      response: aiResponse,
      sessionId: currentSessionId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});