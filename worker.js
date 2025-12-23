/**
 * Cloudflare Worker for Supabase Operations and Cloudflare Stream Uploads
 * 
 * IMPORTANT: This worker ONLY accesses the 'baltay' table in Supabase.
 * It does not and will not access any other tables or resources.
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL (e.g., https://xxx.supabase.co)
 * - SERVICE_ROLE_KEY: Your Supabase service role key
 * - CLOUDFLARE_STREAM_TOKEN: Your Cloudflare Stream API token
 * - CLOUDFLARE_STREAM_ACCOUNT_ID: Your Cloudflare Stream account ID
 * 
 * Routes:
 * - POST /upload-video - Upload video file to Cloudflare Stream
 * - POST /copy-video - Copy video from URL to Cloudflare Stream
 * - POST /add-video - Add a video to the 'baltay' table
 * - POST /update-thumbnail - Update thumbnail timestamp in 'baltay' table
 * - POST /delete-video - Delete a video from the 'baltay' table
 * - POST /download-video - Generate and get download URL for a video
 * - GET /videos - Get all videos from the 'baltay' table (optional, for testing)
 */

export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      const path = url.pathname;
  
      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
  
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      // Get environment variables
      const SUPABASE_URL = env.SUPABASE_URL;
      const SERVICE_ROLE_KEY = env.SERVICE_ROLE_KEY;
      const CLOUDFLARE_STREAM_TOKEN = env.CLOUDFLARE_STREAM_TOKEN;
      const CLOUDFLARE_STREAM_ACCOUNT_ID = env.CLOUDFLARE_STREAM_ACCOUNT_ID;
  
      if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
        return new Response(
          JSON.stringify({ error: 'Missing environment variables' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
  
      try {
        // SECURITY: This worker ONLY accesses the 'baltay' table - no other tables or resources
        
        // Route: Upload video file to Cloudflare Stream
        if (path === '/upload-video' && request.method === 'POST') {
          if (!CLOUDFLARE_STREAM_TOKEN || !CLOUDFLARE_STREAM_ACCOUNT_ID) {
            return new Response(
              JSON.stringify({ error: 'Cloudflare Stream credentials not configured' }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_STREAM_ACCOUNT_ID}/stream`;
          
          // Forward the FormData to Cloudflare Stream
          const streamResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_TOKEN}`,
            },
            body: request.body,
          });
  
          const data = await streamResponse.json();
  
          if (!streamResponse.ok) {
            return new Response(
              JSON.stringify({ error: data.errors?.[0]?.message || 'Upload failed', details: data }),
              {
                status: streamResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          return new Response(
            JSON.stringify(data),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
  
        // Route: Copy video from URL to Cloudflare Stream
        if (path === '/copy-video' && request.method === 'POST') {
          if (!CLOUDFLARE_STREAM_TOKEN || !CLOUDFLARE_STREAM_ACCOUNT_ID) {
            return new Response(
              JSON.stringify({ error: 'Cloudflare Stream credentials not configured' }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          const body = await request.json();
          const copyUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_STREAM_ACCOUNT_ID}/stream/copy`;
          
          const streamResponse = await fetch(copyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_TOKEN}`,
            },
            body: JSON.stringify(body),
          });
  
          const data = await streamResponse.json();
  
          if (!streamResponse.ok) {
            return new Response(
              JSON.stringify({ error: data.errors?.[0]?.message || 'Copy failed', details: data }),
              {
                status: streamResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          return new Response(
            JSON.stringify(data),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        
        // Route: Add video to 'baltay' table
        if (path === '/add-video' && request.method === 'POST') {
          const body = await request.json();
          const { streamId, name, thumbnailTimestamp } = body;
  
          if (!streamId || !name) {
            return new Response(
              JSON.stringify({ error: 'Missing streamId or name' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          const response = await fetch(`${SUPABASE_URL}/rest/v1/baltay`, {
            method: 'POST',
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              streamid: streamId,
              name: name,
              thumbnail_timestamp: thumbnailTimestamp || 0,
            }),
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            return new Response(
              JSON.stringify({ error: data.message || 'Failed to add video', details: data }),
              {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          return new Response(
            JSON.stringify({ success: true, data: data }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
  
        // Route: Update thumbnail timestamp in 'baltay' table
        if (path === '/update-thumbnail' && request.method === 'POST') {
          const body = await request.json();
          const { id, thumbnailTimestamp } = body;
  
          if (!id || thumbnailTimestamp === undefined) {
            return new Response(
              JSON.stringify({ error: 'Missing id or thumbnailTimestamp' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          const response = await fetch(`${SUPABASE_URL}/rest/v1/baltay?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              thumbnail_timestamp: thumbnailTimestamp,
            }),
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            return new Response(
              JSON.stringify({ error: data.message || 'Failed to update thumbnail' }),
              {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          return new Response(
            JSON.stringify({ success: true, data: data }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
  
        // Route: Delete video from 'baltay' table
        if (path === '/delete-video' && request.method === 'POST') {
          const body = await request.json();
          const { id } = body;
  
          if (!id) {
            return new Response(
              JSON.stringify({ error: 'Missing video id' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          const response = await fetch(`${SUPABASE_URL}/rest/v1/baltay?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
          });
  
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return new Response(
              JSON.stringify({ error: errorData.message || 'Failed to delete video' }),
              {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }
  
          return new Response(
            JSON.stringify({ success: true, message: 'Video deleted successfully' }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
  
        // Route: Generate and get download URL for a video
        if (path === '/download-video' && request.method === 'POST') {
          if (!CLOUDFLARE_STREAM_TOKEN || !CLOUDFLARE_STREAM_ACCOUNT_ID) {
            return new Response(
              JSON.stringify({ error: 'Cloudflare Stream credentials not configured' }),
              {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          const body = await request.json();
          const { streamId } = body;

          if (!streamId) {
            return new Response(
              JSON.stringify({ error: 'Missing streamId' }),
              {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          const downloadsUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_STREAM_ACCOUNT_ID}/stream/${streamId}/downloads`;
          
          // Step 1: Enable/generate download (POST request)
          const enableResponse = await fetch(downloadsUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_STREAM_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });

          const enableData = await enableResponse.json();

          // If POST fails with 409, download might already be enabled, continue to check status
          if (!enableResponse.ok && enableResponse.status !== 409) {
            return new Response(
              JSON.stringify({ 
                error: enableData.errors?.[0]?.message || 'Failed to enable download',
                details: enableData 
              }),
              {
                status: enableResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          // Step 2: Check status and get download URL (GET request)
          // Poll for download URL if status is processing
          let downloadUrl = null;
          let status = null;
          let attempts = 0;
          const maxAttempts = 30; // 30 attempts = ~30 seconds max wait
          const pollInterval = 1000; // 1 second

          while (attempts < maxAttempts) {
            const checkResponse = await fetch(downloadsUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${CLOUDFLARE_STREAM_TOKEN}`,
                'Content-Type': 'application/json',
              },
            });

            if (!checkResponse.ok) {
              const errorData = await checkResponse.json().catch(() => ({}));
              return new Response(
                JSON.stringify({ 
                  error: errorData.errors?.[0]?.message || 'Failed to get download status',
                  details: errorData 
                }),
                {
                  status: checkResponse.status,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }

            const checkData = await checkResponse.json();
            
            // Cloudflare Stream API returns result object with status and download URL
            const result = checkData.result || checkData;
            status = result.status || result.state;
            downloadUrl = result.default?.url || result.download_url || result.url;

            // If status is ready and we have a URL, return it
            if (status === 'ready' && downloadUrl) {
              return new Response(
                JSON.stringify({ 
                  success: true,
                  downloadUrl: downloadUrl,
                  status: status 
                }),
                {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }

            // If status is error or failed, return error
            if (status === 'error' || status === 'failed') {
              return new Response(
                JSON.stringify({ 
                  error: 'Download generation failed',
                  status: status 
                }),
                {
                  status: 500,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }

            // If still processing, wait and try again
            if (status === 'processing' || status === 'pending') {
              await new Promise(resolve => setTimeout(resolve, pollInterval));
              attempts++;
              continue;
            }

            // If we have a URL but status is unknown, return it anyway
            if (downloadUrl) {
              return new Response(
                JSON.stringify({ 
                  success: true,
                  downloadUrl: downloadUrl,
                  status: status || 'unknown'
                }),
                {
                  status: 200,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                }
              );
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }

          // Timeout - return current status
          return new Response(
            JSON.stringify({ 
              error: 'Download generation timeout',
              status: status || 'processing',
              message: 'Download is still being generated. Please try again in a few moments.'
            }),
            {
              status: 202, // Accepted but not ready
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // Route: Get videos from 'baltay' table (optional, for testing)
        if (path === '/videos' && request.method === 'GET') {
          const sortBy = url.searchParams.get('sort') || 'created_at.desc';
          const [field, order] = sortBy.split('.');

          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/baltay?select=id,streamid,name,created_at,thumbnail_timestamp&order=${field}.${order}`,
            {
              method: 'GET',
              headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch videos', details: data }),
              {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              }
            );
          }

          return new Response(
            JSON.stringify({ success: true, videos: data }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        // 404 for unknown routes
        return new Response(
          JSON.stringify({ error: 'Not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Internal server error', message: error.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    },
  };
  
  