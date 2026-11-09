// Read-only values still submit with the form, but cannot receive focus or clicks.
function syncLockedFields() {
  document.querySelectorAll('.certificate-booking-modal__dialog input[readonly], .certificate-booking-modal__dialog textarea[readonly]').forEach(field => {
    if (!field.inert) { field.inert = true; field.dataset.certificateLocked = 'true'; }
  });
  document.querySelectorAll('[data-certificate-locked]:not([readonly])').forEach(field => {
    field.inert = false; delete field.dataset.certificateLocked;
  });
}
syncLockedFields();
new MutationObserver(syncLockedFields).observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['readonly']});
