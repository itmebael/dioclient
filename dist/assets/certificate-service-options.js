export function isRequestableCertificate(service) {
 return !/first\s*communion/i.test(String(service?.name||service?.type||''));
}
