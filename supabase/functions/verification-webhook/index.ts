import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  try {
    // Get the Stripe signature from the headers
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature' }), { status: 400 })
    }

    // Get the raw body
    const body = await req.text()

    // Verify the webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
    }

    console.log('Received event:', event.type)

    // Handle verification session completion
    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object as Stripe.Identity.VerificationSession

      console.log('Verification session verified:', session.id)

      // Create Supabase admin client (bypasses RLS)
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Get user_id from session metadata
      const userId = session.metadata?.user_id

      if (!userId) {
        console.error('No user_id in session metadata')
        return new Response(JSON.stringify({ error: 'No user_id' }), { status: 400 })
      }

      // Get the verification request
      const { data: verificationRequest, error: requestError } = await supabaseAdmin
        .from('age_verification_requests')
        .select('id')
        .eq('verification_session_id', session.id)
        .eq('user_id', userId)
        .single()

      if (requestError || !verificationRequest) {
        console.error('Verification request not found:', requestError)
        return new Response(
          JSON.stringify({ error: 'Verification request not found' }),
          { status: 404 }
        )
      }

      // Mark user as verified using the helper function
      const { error: markError } = await supabaseAdmin.rpc('mark_user_verified', {
        p_user_id: userId,
        p_verification_request_id: verificationRequest.id,
        p_expires_in_days: null, // No expiry - permanent verification
      })

      if (markError) {
        console.error('Error marking user verified:', markError)
        return new Response(
          JSON.stringify({ error: 'Failed to mark user verified' }),
          { status: 500 }
        )
      }

      console.log('User verified successfully:', userId)

      // TODO: Send push notification to user
      // You can add notification logic here

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    // Handle verification session requiring input (cancelled/expired)
    if (event.type === 'identity.verification_session.requires_input') {
      const session = event.data.object as Stripe.Identity.VerificationSession

      console.log('Verification session requires input:', session.id, session.status)

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update the verification request status
      const { error: updateError } = await supabaseAdmin
        .from('age_verification_requests')
        .update({
          status: 'pending',
          metadata: {
            session_status: session.status,
            last_error: session.last_error,
          },
        })
        .eq('verification_session_id', session.id)

      if (updateError) {
        console.error('Error updating verification request:', updateError)
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    // Handle verification session failure
    if (
      event.type === 'identity.verification_session.canceled' ||
      event.type === 'identity.verification_session.redacted'
    ) {
      const session = event.data.object as Stripe.Identity.VerificationSession

      console.log('Verification session failed:', session.id, event.type)

      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update the verification request as rejected
      const { error: updateError } = await supabaseAdmin
        .from('age_verification_requests')
        .update({
          status: 'rejected',
          rejection_reason:
            event.type === 'identity.verification_session.canceled'
              ? 'User canceled verification'
              : 'Verification data was redacted',
          metadata: {
            session_status: session.status,
            last_error: session.last_error,
          },
        })
        .eq('verification_session_id', session.id)

      if (updateError) {
        console.error('Error updating verification request:', updateError)
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    // Return success for unhandled events
    console.log('Unhandled event type:', event.type)
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500 }
    )
  }
})
