import { useRouterState } from "@tanstack/react-router";

const WA_URL = "https://wa.me/9443494648";

export function WhatsAppButton() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Do not render on any /admin* route
  if (pathname.startsWith("/admin")) return null;

  function handleClick() {
    // Safe FB Pixel tracking — silently skips if fbq is not loaded
    try {
      if (typeof window !== "undefined" && typeof (window as any).fbq === "function") {
        (window as any).fbq("track", "Contact");
      }
    } catch {
      // noop
    }
    window.open(WA_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55), 0 8px 32px rgba(37, 211, 102, 0.35); }
          60%       { box-shadow: 0 0 0 14px rgba(37, 211, 102, 0), 0 8px 32px rgba(37, 211, 102, 0.35); }
        }

        .wa-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #25D366;
          box-shadow: 0 8px 32px rgba(37, 211, 102, 0.35);
          cursor: pointer;
          border: none;
          padding: 0;
          text-decoration: none;
          outline: none;
          animation: wa-pulse 3.5s ease-in-out infinite;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.22s ease,
                      background 0.18s ease;
          /* Prevent tooltip wrapping from affecting layout */
          isolation: isolate;
        }

        .wa-fab:hover,
        .wa-fab:focus-visible {
          transform: scale(1.12) translateY(-4px);
          background: #20bd5a;
          animation-play-state: paused;
          box-shadow: 0 14px 42px rgba(37, 211, 102, 0.45);
        }

        .wa-fab:active {
          transform: scale(1.04) translateY(-1px);
        }

        .wa-fab svg {
          width: 30px;
          height: 30px;
          fill: #ffffff;
          display: block;
          flex-shrink: 0;
        }

        /* Tooltip */
        .wa-tooltip {
          position: absolute;
          right: calc(100% + 14px);
          top: 50%;
          transform: translateY(-50%) translateX(6px);
          background: rgba(15, 15, 15, 0.88);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.02em;
          white-space: nowrap;
          padding: 7px 14px;
          border-radius: 8px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* Tooltip arrow */
        .wa-tooltip::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          border: 6px solid transparent;
          border-left-color: rgba(15, 15, 15, 0.88);
        }

        /* Only show tooltip on non-touch devices */
        @media (hover: hover) and (pointer: fine) {
          .wa-fab:hover .wa-tooltip,
          .wa-fab:focus-visible .wa-tooltip {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        /* Responsive: smaller on small screens, keep away from bottom nav */
        @media (max-width: 480px) {
          .wa-fab {
            width: 52px;
            height: 52px;
            bottom: 20px;
            right: 16px;
          }
          .wa-fab svg {
            width: 26px;
            height: 26px;
          }
        }
      `}</style>

      <button
        type="button"
        className="wa-fab"
        onClick={handleClick}
        aria-label="Chat with us on WhatsApp"
      >
        {/* Official WhatsApp SVG icon */}
        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16.003 2.667C8.639 2.667 2.667 8.639 2.667 16
            c0 2.347.617 4.651 1.791 6.679L2.667 29.333l6.849-1.765
            A13.28 13.28 0 0 0 16.003 29.333C23.367 29.333 29.333 23.361
            29.333 16S23.367 2.667 16.003 2.667zm0 24.373a11.07 11.07 0 0 1
            -5.645-1.543l-.405-.241-4.063 1.047 1.079-3.883-.265-.418
            A11.04 11.04 0 0 1 4.96 16c0-6.097 4.947-11.04 11.043-11.04
            S27.04 9.903 27.04 16s-4.94 11.04-11.037 11.04zm6.057-8.267
            c-.332-.167-1.964-.965-2.269-1.075-.305-.111-.527-.167-.749.167
            -.222.333-.86 1.075-1.054 1.297-.194.222-.388.25-.72.083
            -.332-.167-1.4-.515-2.668-1.643-.986-.875-1.651-1.957-1.846
            -2.29-.194-.333-.021-.512.146-.678.15-.149.332-.388.499-.582
            .167-.194.222-.333.332-.555.111-.222.056-.416-.028-.582
            -.083-.167-.749-1.805-1.026-2.472-.27-.65-.545-.562-.749-.573
            -.194-.01-.416-.012-.638-.012-.222 0-.582.083-.888.416
            -.305.333-1.165 1.138-1.165 2.776s1.193 3.221 1.36 3.443
            c.167.222 2.348 3.585 5.69 5.029.796.343 1.417.548 1.9.701
            .799.254 1.526.218 2.101.132.641-.096 1.964-.803 2.241-1.578
            .277-.776.277-1.44.194-1.578-.083-.138-.305-.222-.637-.388z"/>
        </svg>

        <span className="wa-tooltip" role="tooltip">
          Chat with us on WhatsApp
        </span>
      </button>
    </>
  );
}
