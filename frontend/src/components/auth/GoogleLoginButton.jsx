import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleLoginButton({ onSuccess, onError }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      onError?.("Google login is not configured.");
      return;
    }

    const render = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) {
        return false;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response?.credential) {
            onSuccess?.(response.credential);
          } else {
            onError?.("Google sign-in failed. Please try again.");
          }
        },
      });

      buttonRef.current.innerHTML = "";

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
        shape: "rectangular",
      });

      setReady(true);
      return true;
    };

    if (render()) return;

    const interval = window.setInterval(() => {
      if (render()) {
        window.clearInterval(interval);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [onSuccess, onError]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="d-flex flex-column align-items-center gap-2 mt-3">
      <div className="text-muted-ink small">or continue with</div>

      <div
        ref={buttonRef}
        style={{ minHeight: 40 }}
        aria-label="Continue with Google"
      />

      {!ready && (
        <div className="text-muted-ink small">
          Loading Google sign-in…
        </div>
      )}
    </div>
  );
}

export default GoogleLoginButton;