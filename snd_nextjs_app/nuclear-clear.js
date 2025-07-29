// NUCLEAR CLEAR SCRIPT
// Run this in the browser console to completely clear everything

console.log('🔍 Starting NUCLEAR CLEAR...');

// Clear localStorage
localStorage.clear();
console.log('✅ Cleared localStorage');

// Clear sessionStorage
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
console.log('✅ Cleared all cookies');

// Clear NextAuth specific cookies
document.cookie = "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "__Host-next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
document.cookie = "next-auth.state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
console.log('✅ Cleared NextAuth cookies');

// Clear any cached data
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
    console.log('✅ Cleared all caches');
  });
}

// Force page reload with cache busting
const timestamp = new Date().getTime();
window.location.href = `/login?t=${timestamp}&clear=1&nuclear=1`;
console.log('🔄 Redirecting to login with nuclear clear...'); 