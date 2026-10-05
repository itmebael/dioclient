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
    document.querySelectorAll("select[name=appointmentType]").forEach((select) => {
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
        if (label && label.textContent !== "Full Name") label.textContent = "Full Name";
        const input = nameField.querySelector("input");
        if (input && input.placeholder !== "Your full name") input.placeholder = "Your full name";
      }
      if (fatherField) {
        fatherField.hidden = true;
        const input = fatherField.querySelector("input");
        if (input) {
          input.required = false;
          input.disabled = true;
          if (!input.value) input.value = "Not Provided";
        }
      }
      const typeLabel = typeField?.querySelector("span");
      if (typeLabel && typeLabel.textContent !== "Booking Type") typeLabel.textContent = "Booking Type";
      if (!form.querySelector('.booking-reference-details')) {
        const details = document.createElement('div');
        details.className = 'booking-reference-details';
        details.innerHTML = "<section data-booking-type=\"Sacraments\"><label class=\"booking-detail-choice\" for=\"booking-sacramentType\">Type of Sacrament *</label><select id=\"booking-sacramentType\" name=\"sacramentType\"><option value=\"\">Select an option</option><option data-amount=\"300\">Baptism (Bunyag)</option><option data-amount=\"100\">Confirmation (Kumpirma)</option><option data-amount=\"0\">Anointing of the Sick (Santolana)</option></select></section><section data-booking-type=\"Mass booking\"><label class=\"booking-detail-choice\" for=\"booking-bookingMassType\">Type of Mass *</label><select id=\"booking-bookingMassType\" name=\"bookingMassType\"><option value=\"\">Select an option</option><option data-amount=\"4000\">Feast Day Mass (Patronal Feast)</option><option data-amount=\"3000\">Solemnity of a Saint (Kaadlawan han Santos)</option><option data-amount=\"10000\">Pontifical Mass (Presided by the Bishop)</option><option data-amount=\"3000\">Wedding Mass</option><option data-amount=\"3000\">Special Mass Intention (Birthday, Anniversary, etc.)</option><option data-amount=\"1500\">Home Mass</option><option data-amount=\"1500\">Funeral Mass</option></select></section><section data-booking-type=\"Blessing request\"><label class=\"booking-detail-choice\" for=\"booking-blessingType\">Type of Blessing *</label><select id=\"booking-blessingType\" name=\"blessingType\"><option value=\"\">Select an option</option><option>House Blessing</option><option>Transportation</option><option>Saint/s</option><option>Items</option><option>Others</option></select></section><section data-booking-type=\"Confession\"><label class=\"booking-detail-choice\" for=\"booking-confessionSchedule\">Confession Schedule *</label><select id=\"booking-confessionSchedule\" name=\"confessionSchedule\"><option value=\"\">Select an option</option><option>After Mass</option><option>Special Request</option></select></section><section data-booking-type=\"Parish Hall\"><label class=\"booking-detail-choice\" for=\"booking-hallType\">Hall Type *</label><select id=\"booking-hallType\" name=\"hallType\"><option value=\"\">Select an option</option><option data-amount=\"3000\">Air-Conditioned</option><option data-amount=\"1000\">Non-Air-Conditioned</option></select></section><div class=\"booking-amount\" aria-live=\"polite\"><span>Amount to Pay (Arancel)</span><strong>Select an option</strong></div><p class=\"booking-payment-notice\">Payment is not collected online. Please settle the applicable fee at the parish/convent office.</p>";
        form.insertBefore(details, massField || form.querySelector("button[type=submit]"));
      }
      form.querySelector('.booking-request-date')?.remove();
      const dateControl = form.querySelector('[name="appointmentDate"]');
      if (dateControl) { dateControl.type = 'hidden'; dateControl.closest('label').hidden = true; }
      const types = [['Sacraments','Sacraments'],['Mass booking','Mass'],['Blessing request','Blessing'],['Confession','Confession'],['Parish Hall','Parish Hall']];
      if (bookingType.dataset.catalog !== 'five') {
        const current = bookingType.value;
        bookingType.replaceChildren(...types.map(([value,label]) => new Option(label,value)));
        bookingType.value = types.some(([value]) => value === current) ? current : 'Sacraments';
        bookingType.dataset.catalog = 'five';
        bookingType.dispatchEvent(new Event('change', {bubbles:true}));
      }
      if (!form.querySelector('[name="appointmentVenue"]')) {
        const venue = document.createElement('label');
        venue.className = 'login-field login-field--wide booking-venue';
        venue.innerHTML = '<span>Venue (Optional)</span><input name="appointmentVenue" placeholder="Enter venue">';
        form.insertBefore(venue, form.querySelector('button[type="submit"]'));
      }
      if (!form.querySelector('[name="appointmentNotes"]')) {
        const notes = document.createElement('label');
        notes.className = 'login-field login-field--wide booking-notes';
        notes.innerHTML = '<span>Additional Notes (Optional)</span><textarea name="appointmentNotes" rows="3" placeholder="Enter any additional information, special requests, or reminders…"></textarea>';
        form.insertBefore(notes, form.querySelector('button[type="submit"]'));
      }
      const heading = panel.querySelector('.user-panel__header h4');
      if (heading && heading.textContent !== 'Start Booking Request') heading.textContent = 'Start Booking Request';
      const refreshFields = () => {
        const selected = bookingType.value;
        if (massField) massField.hidden = true;
        if (blessingField) blessingField.hidden = true;
        const details = form.querySelector('.booking-reference-details');
        details.querySelectorAll('section').forEach((section) => {
          const active = section.dataset.bookingType === selected;
          section.hidden = !active;

          section.querySelectorAll('select,input:not([type="radio"])').forEach((control) => {
            control.disabled = !active;
            control.required = active && control.tagName === 'SELECT';
          });
        });
        const massInput = massField?.querySelector('input');
        const otherInput = blessingField?.querySelector('input');
        const massLabel = massField?.querySelector('span');
        if (massLabel && massLabel.textContent !== 'Type of Mass') massLabel.textContent = 'Type of Mass';
        if (massInput) {
          massInput.required = false;
          massInput.disabled = true;
          massInput.value = selected === 'Mass booking' ? details.querySelector('[data-booking-type="Mass booking"] select').value : '';
        }
        if (otherInput) {
          otherInput.required = false;
          otherInput.disabled = true;
          const section = details.querySelector('[data-booking-type="' + selected + '"]');
          otherInput.value = selected === 'Blessing request' || selected === 'Confession' || selected === 'Parish Hall' ? [...section.querySelectorAll('select,input:not([type="radio"])')].map(control => control.value.trim()).filter(Boolean).join(' - ') : '';
        }
        const option = details.querySelector('select:not(:disabled)')?.selectedOptions[0];
        const amount = Number(option?.dataset.amount || 0);
        const amountText = selected === 'Blessing request' ? 'No Fixed Fee — Voluntary Offering' : !option?.value ? 'Select an option' : amount ? '\u20b1' + amount.toLocaleString('en-US') : 'No Fee';
        details.querySelector('.booking-payment-notice').hidden = !amount;
        const amountLabel = details.querySelector('.booking-amount span');
        const amountTitle = selected === 'Blessing request' ? 'Offering' : 'Amount to Pay (Arancel)';
        if (amountLabel.textContent !== amountTitle) amountLabel.textContent = amountTitle;
        const venue = form.querySelector('[name=appointmentVenue]');
        venue.disabled = selected === 'Confession' || selected === 'Parish Hall';
        venue.closest('label').hidden = venue.disabled;
        const display = details.querySelector('.booking-amount strong');
        if (display.textContent !== amountText) display.textContent = amountText;
      };
      if (!form.dataset.bookingFieldsBound) {
        form.dataset.bookingFieldsBound = '1';
        bookingType.addEventListener('change', () => window.setTimeout(refreshFields, 0));
        form.querySelector('.booking-reference-details').addEventListener('input', refreshFields);
        form.querySelector('.booking-reference-details').addEventListener('change', refreshFields);
        form.addEventListener('reset', () => window.setTimeout(refreshFields, 0));
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

  function removeBulletinMenuItem() {
    document.querySelectorAll('#workspace-sidebar .sidebar__nav .nav-item').forEach((item) => {
      if (item.textContent.trim() === 'Bulletin') item.remove();
    });
  }

  const observer = new MutationObserver(() => {
    removeBulletinMenuItem();
    updateDashboard();
    addConfessionOption();
    enhanceAppointmentBooking();
    removeAccountDetailsMenuItem();
    fixScheduleEyebrowEncoding();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  removeBulletinMenuItem();
  updateDashboard();
  addConfessionOption();
  enhanceAppointmentBooking();
  removeAccountDetailsMenuItem();
  fixScheduleEyebrowEncoding();
})();
