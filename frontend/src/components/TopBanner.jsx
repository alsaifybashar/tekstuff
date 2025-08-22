// TopBanner.jsx
import { useEffect, useState } from "react";

export default function TopBanner({
  message,
  href,
  linkLabel,
  endsAtISO,
  defaultVisible = true,
  colorClass = "bg-primary",
  className = "",
}) {
  const [visible, setVisible] = useState(defaultVisible);
  const [remaining, setRemaining] = useState(null);

  const formatRemaining = (ms) => {
    if (ms <= 0) return "0 dagar 0 timmar 0 min. 0 sek.";
    const sec = Math.floor(ms / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${days} dagar ${hours} timmar ${minutes} min. ${seconds} sek.`;
  };

  useEffect(() => {
    if (!endsAtISO) return;
    const end = new Date(endsAtISO).getTime();
    const tick = () => setRemaining(formatRemaining(end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAtISO]);

  if (!visible) return null;

  return (
    <div
      className={`${colorClass} text-white small py-1 w-100 position-sticky top-0 z-3 ${className}`}
      role="region"
      aria-label="Kampanjbanner"
    >
      <div className="container-fluid d-flex align-items-center justify-content-center gap-2">
        <span className="text-center">
          {message}
          {href && linkLabel && (
            <>
              {" "}
              <a className="text-white text-decoration-underline" href={href}>
                {linkLabel}
              </a>
            </>
          )}
          {endsAtISO && (
            <>
              {" "}
              <span aria-live="polite">• {remaining}</span>
            </>
          )}
        </span>

        <button
          type="button"
          className="btn btn-sm btn-link text-white text-decoration-none ms-2"
          aria-label="Stäng banner"
          onClick={() => setVisible(false)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
