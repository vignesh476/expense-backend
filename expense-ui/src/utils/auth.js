export function setAccessToken(token) { localStorage.setItem('access', token); }
export function getAccessToken() { return localStorage.getItem('access'); }
export function setRefreshToken(token) { localStorage.setItem('refresh', token); }
export function getRefreshToken() { return localStorage.getItem('refresh'); }
export function logout() { localStorage.removeItem('access'); localStorage.removeItem('refresh'); localStorage.removeItem('user'); }
export function setUser(u) { localStorage.setItem('user', JSON.stringify(u)); }
export function getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } }
