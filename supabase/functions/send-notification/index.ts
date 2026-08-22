import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BACKEND_URL = Deno.env.get("BACKEND_URL") || "https://sweeto.store"
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || ""

serve(async (req) => {
  try {
    const payload = await req.json()
    
    console.log(`Forwarding webhook event for table: ${payload.table}, action: ${payload.type}`);
    
    // Forward the webhook database insert/update event to the secure backend router
    const response = await fetch(`${BACKEND_URL}/api/internal/webhook-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": WEBHOOK_SECRET
      },
      body: JSON.stringify(payload)
    })
    
    const result = await response.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(result);
    } catch {
      jsonResult = { message: result };
    }
    
    return new Response(JSON.stringify({ success: true, backendResponse: jsonResult }), {
      headers: { "Content-Type": "application/json" },
      status: response.status
    })
  } catch (error) {
    console.error(`Edge Function error processing webhook:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400
    })
  }
})
