import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, to, subject, body, smtpHost, smtpPort } = await req.json();

    if (!email || !password || !to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, to, subject, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default SMTP settings for common providers
    let host = smtpHost;
    let port = smtpPort || 465;

    if (!host) {
      // Auto-detect SMTP host based on email domain
      const domain = email.split('@')[1]?.toLowerCase();
      const smtpHosts: Record<string, { host: string; port: number }> = {
        'gmail.com': { host: 'smtp.gmail.com', port: 465 },
        'outlook.com': { host: 'smtp-mail.outlook.com', port: 587 },
        'hotmail.com': { host: 'smtp-mail.outlook.com', port: 587 },
        'yahoo.com': { host: 'smtp.mail.yahoo.com', port: 465 },
        'proton.me': { host: 'smtp.protonmail.com', port: 465 }, // Requires ProtonMail Bridge
        'protonmail.com': { host: 'smtp.protonmail.com', port: 465 },
      };

      const config = smtpHosts[domain];
      if (config) {
        host = config.host;
        port = config.port;
      } else {
        return new Response(
          JSON.stringify({ 
            error: `Unknown email provider: ${domain}. Please provide smtpHost and smtpPort.`,
            note: 'ProtonMail requires ProtonMail Bridge running locally for SMTP access.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port: port,
        tls: port === 465,
        auth: {
          username: email,
          password: password,
        },
      },
    });

    await client.send({
      from: email,
      to: to,
      subject: subject,
      content: body,
      html: body.includes('<') ? body : undefined,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SMTP Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send email',
        hint: 'For Gmail: Enable "Less secure apps" or use App Password. For ProtonMail: Requires Bridge app.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
