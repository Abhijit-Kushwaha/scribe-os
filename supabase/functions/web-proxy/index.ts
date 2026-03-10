import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the target URL server-side (bypasses X-Frame-Options/CSP)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      // For non-HTML, return info
      return new Response(JSON.stringify({ 
        error: "non-html", 
        contentType,
        status: response.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let html = await response.text();

    // Inject <base> tag so relative URLs resolve correctly
    const baseUrl = new URL(url);
    const baseHref = `${baseUrl.protocol}//${baseUrl.host}`;
    
    // Remove existing base tags
    html = html.replace(/<base\s[^>]*>/gi, "");
    
    // Inject base tag after <head>
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${baseHref}/" target="_self">`);
    } else if (html.includes("<head ")) {
      html = html.replace(/<head\s/, `<head><base href="${baseHref}/" target="_self"><head `);
    } else {
      html = `<base href="${baseHref}/" target="_self">` + html;
    }

    // Intercept link clicks to stay in our proxy
    // Add a small script that catches navigation and posts message to parent
    const interceptScript = `
<script>
(function(){
  // Intercept all clicks on anchors
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el || !el.href) return;
    // Skip javascript: and # links
    if (el.href.startsWith('javascript:') || el.href === '#') return;
    e.preventDefault();
    e.stopPropagation();
    window.parent.postMessage({ type: 'navigate', url: el.href }, '*');
  }, true);
  
  // Intercept form submissions
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (form.method && form.method.toLowerCase() === 'get' && form.action) {
      e.preventDefault();
      var fd = new FormData(form);
      var params = new URLSearchParams(fd).toString();
      var url = form.action + (form.action.includes('?') ? '&' : '?') + params;
      window.parent.postMessage({ type: 'navigate', url: url }, '*');
    }
  }, true);
})();
</script>`;

    // Inject before </body> or at end
    if (html.includes("</body>")) {
      html = html.replace("</body>", interceptScript + "</body>");
    } else {
      html += interceptScript;
    }

    return new Response(JSON.stringify({ html, finalUrl: response.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Fetch failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
