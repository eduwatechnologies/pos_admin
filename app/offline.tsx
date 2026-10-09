import { Download, WifiOff } from 'lucide-react'

export const dynamic = 'force-static'
export const revalidate = false

export default function OfflinePage() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Offline — Kounter POS</title>
        <meta name="theme-color" content="#0D9488" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <style>
          {`
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              min-height: 100vh; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              background: #F3F4F6; 
              color: #111827;
              padding: 1.5rem;
            }
            .container { text-align: center; max-width: 360px; }
            .icon { 
              width: 80px; height: 80px; 
              margin: 0 auto 1.5rem; 
              display: flex; align-items: center; justify-content: center;
              background: #0D948820; border-radius: 50%;
            }
            h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
            p { color: #6B7280; margin-bottom: 1.5rem; line-height: 1.5; }
            .features { text-align: left; background: white; padding: 1rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .features li { margin: 0.5rem 0; color: #374151; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
            .check { color: #0D9488; flex-shrink: 0; }
            .retry { margin-top: 1.5rem; }
            button { 
              background: #0D9488; color: white; border: none; 
              padding: 0.75rem 1.5rem; border-radius: 0.5rem; 
              font-weight: 600; cursor: pointer; font-size: 1rem;
            }
            button:disabled { opacity: 0.6; cursor: not-allowed; }
            .status { margin-top: 1rem; font-size: 0.85rem; color: #6B7280; }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="icon">
            <WifiOff size={40} color="#0D9488" />
          </div>
          <h1>You're Offline</h1>
          <p>No internet connection detected. Kounter POS can still work offline for core POS operations.</p>
          
          <ul className="features">
            <li><span className="check">✓</span> Browse products & categories</li>
            <li><span className="check">✓</span> Add items to cart</li>
            <li><span className="check">✓</span> Complete cash/card sales</li>
            <li><span className="check">✓</span> Print receipts</li>
            <li><span className="check">✓</span> Data syncs automatically when online</li>
          </ul>

          <div className="retry">
            <button id="retryBtn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>

          <div className="status" id="status">
            Waiting for connection...
          </div>
        </div>

        <script>
          {`
            const statusEl = document.getElementById('status');
            const btn = document.getElementById('retryBtn');
            
            function updateStatus() {
              if (navigator.onLine) {
                statusEl.textContent = 'Online! Reloading...';
                btn.disabled = true;
                window.location.reload();
              } else {
                statusEl.textContent = 'Still offline. Check your connection.';
              }
            }

            window.addEventListener('online', updateStatus);
            window.addEventListener('focus', updateStatus);
            
            // Check periodically
            setInterval(updateStatus, 5000);
          `}
        </script>
      </body>
    </html>
  )
}