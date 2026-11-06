// Reads the `theme` key of `localStorage` (`light`, `dark`, or `system`). For
// `system` or a missing value, it falls back to
// `matchMedia("(prefers-color-scheme: dark)")`. It toggles `.dark` on <html>.
// csp.ts computes the CSP hash of this script from the string below.
export const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((t===null||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;
