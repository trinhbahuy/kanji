// Chỉ giữ access token trong bộ nhớ. Không lưu password/token vào localStorage.
window.AuthAPI = (() => {
  let accessToken = '', expiresAt = 0;
  const base = () => window.APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  async function login(username, password) {
    const response = await fetch(base() + '/auth-api/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username, password}), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Không đăng nhập được. Kiểm tra tài khoản hoặc thử lại sau.');
    const data = await response.json();
    if (!data.access_token || !Number.isFinite(data.expires_in)) throw new Error('API trả về phiên đăng nhập không hợp lệ.');
    accessToken = data.access_token;
    expiresAt = Date.now() + data.expires_in * 1000;
  }
  function clear() {accessToken = ''; expiresAt = 0;}
  function token() {if (Date.now() >= expiresAt) clear(); return accessToken;}
  async function logout() {
    const current = accessToken;
    clear();
    if (!current) return;
    const response = await fetch(base() + '/auth-api/logout', {method:'POST',headers:{Authorization:'Bearer '+current}});
    if (!response.ok) throw new Error('Đã thoát trên trình duyệt, nhưng chưa kết thúc được phiên ở máy chủ.');
  }
  return {login, logout, token, clear};
})();
