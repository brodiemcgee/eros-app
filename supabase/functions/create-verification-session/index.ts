import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if user already has a pending verification
    const { data: existingRequest } = await supabaseClient
      .from('age_verification_requests')
      .select('id, status, verification_session_id')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    // If already approved, return success
    if (existingRequest?.status === 'approved') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Already verified',
          status: 'approved',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If pending, check if session is still valid
    if (existingRequest?.status === 'pending' && existingRequest.verification_session_id) {
      try {
        const session = await stripe.identity.verificationSessions.retrieve(
          existingRequest.verification_session_id
        )

        // If session is still active, return it
        if (session.status === 'requires_input' || session.status === 'processing') {
          return new Response(
            JSON.stringify({
              success: true,
              client_secret: session.client_secret,
              session_id: session.id,
              status: session.status,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      } catch (error) {
        console.error('Error retrieving existing session:', error)
        // Continue to create new session
      }
    }

    // Create a new Stripe Identity VerificationSession
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: user.id,
      },
      options: {
        document: {
          require_matching_selfie: true, // Require selfie matching for stronger verification
        },
      },
    })

    // Store the verification request in the database
    const { data: verificationRequest, error: dbError } = await supabaseClient
      .from('age_verification_requests')
      .insert({
        user_id: user.id,
        method: 'third_party',
        status: 'pending',
        verification_session_id: verificationSession.id,
        verification_provider: 'stripe_identity',
        metadata: {
          session_status: verificationSession.status,
        },
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to create verification request' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Return the client_secret to the app
    return new Response(
      JSON.stringify({
        success: true,
        client_secret: verificationSession.client_secret,
        session_id: verificationSession.id,
        verification_request_id: verificationRequest.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
