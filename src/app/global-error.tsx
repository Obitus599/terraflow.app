"use client";

import { useEffect } from "react";

/**
 * Top-level error boundary. Catches errors that escape every other boundary,
 * including those in the root layout. Must include its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#0A0A0A",
          color: "#FAFAFA",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          colorScheme: "dark",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#A3A3A3",
              margin: 0,
            }}
          >
            Application error
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              letterSpacing: "-0.025em",
              margin: "0.75rem 0 0.5rem",
              fontWeight: 500,
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: "#D4D4D4", margin: "0.5rem 0 1.5rem" }}>
            The page hit an unhandled error.
            {error.digest ? ` Error ID: ${error.digest}.` : ""} Reload to try
            again, or report it to Alex if it persists.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#D4FF3D",
              color: "#0A0A0A",
              border: 0,
              borderRadius: 999,
              padding: "0.625rem 1.25rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
