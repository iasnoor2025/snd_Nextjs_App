// Manual session clearing script
// Run this in the browser console to clear all session data

console.log('🔍 Clearing all session data...');

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
console.log('✅ Cleared NextAuth cookies');

// Force page reload
const timestamp = new Date().getTime();
window.location.href = `/login?t=${timestamp}`;
console.log('🔄 Redirecting to login page...'); 