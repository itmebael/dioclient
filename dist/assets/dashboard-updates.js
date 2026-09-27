(() => {
  const isPreview = ["localhost", "127.0.0.1"].includes(location.hostname) &&
    new URLSearchParams(location.search).get("previewRole") === "user" &&
    (() => {
      try { return JSON.parse(sessionStorage.getItem("diocese-dashboard-db-session"))?.accessToken === "local-preview-only"; }
      catch { return false; }
    })();
  const announcements = [
    ["Feast of Our Lady of the Annunciation", "Join the parish community for prayer and celebration on March 25."],
    ["Parish youth gathering", "Young parishioners are invited to our upcoming formation and fellowship activities."],
    ["Community outreach", "Watch for updates on this month’s parish service and outreach events."],
  ];

  const bulletins = [
    ["Project transparency", "Updates on ongoing parish projects and their progress will be shared with the community."],
    ["Parish donations", "Donations support the upkeep of the church and the parish’s pastoral work."],
    ["Visiting priests", "Contributions help provide for invited priests serving parish celebrations and events."],
    ["Parish matters", "Please check with the parish office for current schedules, notices, and other community needs."],
  ];

  function makeCard(title, items, className) {
    const card = document.createElement("article");
    card.className = `user-home-card ${className}`;
    const heading = document.createElement("h4");
    heading.textContent = title;
    card.append(heading);
    const list = document.createElement("div");
    list.className = "dashboard-sample-list";
    items.forEach(([itemTitle, copy]) => {
      const item = document.createElement("section");
      const itemHeading = document.createElement("strong");
      const description = document.createElement("p");
      itemHeading.textContent = itemTitle;
      description.textContent = copy;
      item.append(itemHeading, description);
      list.append(item);
    });
    card.append(list);
    return card;
  }

  function updateDashboard() {
    const dashboard = document.querySelector(".user-home-dashboard");
    if (!dashboard) return;

    const actionGrid = dashboard.querySelector(".user-home-actions");
    if (actionGrid && !dashboard.querySelector(".dashboard-extra-actions")) {
      const extraActions = document.createElement("div");
      extraActions.className = "dashboard-extra-actions";
      const shortcuts = [
        ["Upcoming Mass", "See parish Mass schedules", "user-mass-schedules"],
        ["My Recent Requests", "Review your submitted requests", "user-my-requests"],
        ["Parish Announcements", "Read the latest parish news", "user-announcement"],
        ["Bulletin", "View parish updates and notices", "bulletin"],
        ["Send Us a Message", "Contact the parish office", "user-help-support"],
      ];
      shortcuts.forEach(([title, description, destination]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "user-home-action dashboard-shortcut";
        const heading = document.createElement("strong");
        const detail = document.createElement("span");
        heading.textContent = title;
        detail.textContent = description;
        button.append(heading, detail);
        button.addEventListener("click", () => {
          if (destination === "bulletin") {
            location.hash = 'user-bulletin';
            return;
          }
          const target = [...document.querySelectorAll(".nav-item")].find((item) => item.textContent.trim().includes(title === "Upcoming Mass" ? "Mass Schedules" : destination === "user-my-requests" ? "My Requests" : destination === "user-announcement" ? "Parish Announcements" : "Send us a Message"));
          target?.click();
        });
        extraActions.append(button);
      });
      actionGrid.after(extraActions);
    }

    const actions = dashboard.querySelectorAll(".user-home-action");
    actions.forEach((action) => {
      const title = action.querySelector("strong");
      if (title?.textContent.trim() === "Book Now") {
        const description = action.querySelector("span:not(.user-home-action__icon):not(.user-home-action__arrow)");
        if (description && description.textContent !== "Schedule a Mass, Blessing, or Confession") {
          description.textContent = "Schedule a Mass, Blessing, or Confession";
        }
      }
    });

    const massCard = dashboard.querySelector(".user-home-card--mass");
    if (isPreview && massCard && !massCard.querySelector(".user-mass-preview")) {
      const header = massCard.querySelector(".user-home-card__header");
      if (header && !massCard.querySelector(".dashboard-sample-mass")) {
        const sample = document.createElement("p");
        sample.className = "dashboard-sample-mass";
        sample.textContent = "Sunday – 6:00 AM · Parish Church";
        header.after(sample);
      }
    }

    const grid = dashboard.querySelector(".user-home-grid");
    if (isPreview && grid && !grid.querySelector(".dashboard-sample-announcements")) {
      grid.append(makeCard("Parish Announcements", announcements, "dashboard-sample-announcements"));
    }
    if (isPreview && grid && !grid.querySelector(".dashboard-sample-bulletin")) {
      grid.append(makeCard("Parish Bulletin", bulletins, "dashboard-sample-bulletin"));
    }

    const chatCard = dashboard.querySelector(".user-chat-card");
    if (chatCard) {
      const title = chatCard.querySelector("h4");
      const description = chatCard.querySelector("p");
      if (title && title.textContent !== "Send Us a Message") title.textContent = "Send Us a Message";
      if (description && description.textContent !== "Have a question? Chat with the parish office.") {
        description.textContent = "Have a question? Chat with the parish office.";
      }
    }
  }

  function addConfessionOption() {
    document.querySelectorAll("select").forEach((select) => {
      const context = `${select.name} ${select.id} ${select.getAttribute("aria-label") || ""} ${select.parentElement?.textContent || ""}`.toLowerCase();
      if (!/appointment|booking|service|visit/.test(context) || [...select.options].some((option) => /confession/i.test(option.text))) return;
      const option = document.createElement("option");
      option.value = "Confession";
      option.textContent = "Confession";
      select.append(option);
    });
  }

  const observer = new MutationObserver(() => {
    updateDashboard();
    addConfessionOption();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  updateDashboard();
  addConfessionOption();
})();
