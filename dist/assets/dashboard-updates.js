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

  function removeAccountDetailsMenuItem() {
    document.querySelectorAll(".profile-menu__item").forEach((item) => {
      const title = item.querySelector("strong")?.textContent.trim();
      const description = item.querySelector("span")?.textContent.trim();
      if (title === "Profile" && description === "View account details") item.remove();
    });
  }

  function enhanceAppointmentBooking() {
    const panel = document.querySelector(".schedules-request-panel");
    const daySection = document.querySelector(".user-appointment-side__section");
    if (!panel || !daySection) return;

    const form = panel.querySelector(".user-appointment-form");
    const bookingType = form?.querySelector('[name="appointmentType"]');
    if (form && bookingType) {
      const fields = [...form.querySelectorAll("label")];
      const nameField = fields.find((field) => field.querySelector('[name="appointmentName"]'));
      const fatherField = fields.find((field) => field.querySelector('[name="appointmentFatherName"]'));
      const typeField = fields.find((field) => field.querySelector('[name="appointmentType"]'));
      const massField = form.querySelector('[data-apt-field="massType"]');
      const blessingField = form.querySelector('[data-apt-field="otherDetails"]');
      const timeSelect = form.querySelector('[name="appointmentTime"]');
      if (nameField) {
        const label = nameField.querySelector("span");
        if (label && label.textContent !== "Name") label.textContent = "Name";
        const input = nameField.querySelector("input");
        if (input && input.placeholder !== "Individual, BEC, or Barangay name") input.placeholder = "Individual, BEC, or Barangay name";
      }
      if (fatherField) {
        fatherField.hidden = true;
        const input = fatherField.querySelector("input");
        if (input) {
          input.required = false;
          if (!input.value) input.value = "Not Provided";
        }
      }
      const typeLabel = typeField?.querySelector("span");
      if (typeLabel && typeLabel.textContent !== "Booking Type") typeLabel.textContent = "Booking Type";
      const refreshFields = () => {
        const selected = bookingType.value;
        const isMass = selected === "Mass booking";
        const isBlessing = selected === "Blessing request";
        const fatherInput = fatherField?.querySelector("input");
        if (fatherInput) {
          fatherInput.required = false;
          if (!fatherInput.value) fatherInput.value = "Not Provided";
        }
        if (massField) massField.hidden = !isMass;
        if (blessingField) blessingField.hidden = !isBlessing;
        const massLabel = massField?.querySelector("span");
        if (massLabel && massLabel.textContent !== "Mass Details: Type of Mass") massLabel.textContent = "Mass Details: Type of Mass";
        const massInput = massField?.querySelector("input");
        const blessingInput = blessingField?.querySelector("input");
        if (massInput) massInput.required = isMass;
        if (blessingInput) {
          blessingInput.required = isBlessing;
          const label = blessingField.querySelector("span");
          if (label && label.textContent !== "Blessing Details") label.textContent = "Blessing Details";
          const placeholder = "Describe the blessing or item requested";
          if (blessingInput.placeholder !== placeholder) blessingInput.placeholder = placeholder;
        }
      };
      if (!form.dataset.bookingFieldsBound) {
        form.dataset.bookingFieldsBound = "1";
        bookingType.addEventListener("change", () => window.setTimeout(refreshFields, 0));
        form.addEventListener("reset", () => window.setTimeout(refreshFields, 0));
      }
      refreshFields();
      if (timeSelect) [...timeSelect.options].forEach((option) => {
        option.hidden = option.disabled;
      });
    }

    let overlay = document.querySelector(".appointment-booking-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "appointment-booking-overlay";
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      (panel.closest(".dashboard-frame--user") || document.body).append(overlay);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.closest("[data-booking-close]")) closeBooking();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.hidden) closeBooking();
      });
    }

    if (!panel.querySelector("[data-booking-close]")) {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "appointment-booking-close";
      close.setAttribute("data-booking-close", "");
      close.setAttribute("aria-label", "Close booking form");
      close.textContent = "Close";
      close.addEventListener("click", closeBooking);
      panel.querySelector(".user-panel__header")?.append(close);
    }

    let bookButton = daySection.querySelector(".appointment-book-here");
    if (!bookButton) {
      bookButton = document.createElement("button");
      bookButton.type = "button";
      bookButton.className = "appointment-book-here";
      bookButton.textContent = "Book here";
      bookButton.addEventListener("click", openBooking);
      daySection.append(bookButton);
    }

    function openBooking() {
      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      panel.classList.add("is-booking-open");
      document.body.classList.add("has-appointment-booking");
      window.setTimeout(() => panel.querySelector('[name="appointmentName"]')?.focus(), 0);
    }
    function closeBooking() {
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      document.querySelectorAll(".schedules-request-panel.is-booking-open").forEach((openPanel) => {
        openPanel.classList.remove("is-booking-open");
      });
      document.body.classList.remove("has-appointment-booking");
    }

  }

  function fixScheduleEyebrowEncoding() {
    document.querySelectorAll('.workspace__eyebrow').forEach((label) => {
      if (/^DayÃ¢â‚¬â„¢s schedule$/.test(label.textContent.trim())) {
        label.textContent = 'Day’s schedule';
      }
    });
  }

  const observer = new MutationObserver(() => {
    updateDashboard();
    addConfessionOption();
    enhanceAppointmentBooking();
    removeAccountDetailsMenuItem();
    fixScheduleEyebrowEncoding();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  updateDashboard();
  addConfessionOption();
  enhanceAppointmentBooking();
  removeAccountDetailsMenuItem();
  fixScheduleEyebrowEncoding();
})();
