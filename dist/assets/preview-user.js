// Local-only dashboard preview. It never runs on a deployed hostname.
(function () {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const requestedPreview = new URLSearchParams(location.search).get("previewRole") === "user";
  const sessionKey = "diocese-dashboard-db-session";
  let storedSession;
  try { storedSession = JSON.parse(sessionStorage.getItem(sessionKey)); } catch {}
  const hasRealSession = storedSession?.accessToken && storedSession.accessToken !== "local-preview-only";
  if (hasRealSession) return;
  if (!isLocal || !requestedPreview) {
    if (storedSession?.accessToken === "local-preview-only") sessionStorage.removeItem(sessionKey);
    return;
  }

  const userId = "00000000-0000-4000-8000-000000000001";
  const email = "preview@example.test";
  const parish = "St. Peter & Paul Parish";
  sessionStorage.setItem("diocese-dashboard-db-session", JSON.stringify({
    role: "user",
    email,
    displayName: "Maria Santos",
    accessToken: "local-preview-only",
    refreshToken: "local-preview-only",
    expiresAt: Math.floor(Date.now() / 1000) + 86400,
    userId,
    parish_name: parish,
    parish_id: "preview-parish",
  }));
  localStorage.setItem("diocese-dashboard-theme", "light");

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : input.url;
    if (!url.includes("supabase.co")) return originalFetch(input, init);

    const path = new URL(url).pathname;
    const method = String(init.method || "GET").toUpperCase();
    if (path.startsWith("/rest/v1/") && method !== "GET" &&
        path !== "/rest/v1/rpc/get_parish_booking_calendar_rows") {
      return new Response(JSON.stringify({ message: "Preview mode is read-only." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    let data = [];
    if (path === "/auth/v1/user") {
      data = { id: userId, email, user_metadata: { role: "user", display_name: "Maria Santos" } };
    } else if (path.startsWith("/rest/v1/registered_users")) {
      data = [{ id: userId, full_name: "Maria Santos", email, parish_name: parish, parish_id: "preview-parish" }];
    } else if (path.includes("get_parish_id_by_email") || path.startsWith("/rest/v1/parishes")) {
      data = [{ id: "preview-parish", parish_name: parish }];
    } else if (path.includes("/parish_events")) {
      data = [{ id: "preview-mass", title: "Sunday Holy Mass", event_date: "2026-09-20", start_time: "08:00", location: "Main Parish Church", event_type: "Mass" }];
    } else if (path.includes("/diocese_service_bookings")) {
      data = [{ id: "preview-booking", reference_number: "REQ-2026-014", service_name: "Baptismal Certificate", booking_status: "Pending", created_at: "2026-09-18" }];
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
})();
