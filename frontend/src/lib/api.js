/**
 * Utilitário para fazer requisições HTTP com interceptor automático de autenticação
 * Redireciona para login quando token expira (401)
 * 
 * Nota: O token é adicionado automaticamente via fetch override em main.jsx
 * Este wrapper apenas cuida do tratamento de erros 401
 */

export async function apiCall(resource, config = {}) {
  const response = await fetch(resource, config);

  // Trata 401 - Token expirado
  if (response.status === 401) {
    // Limpa token
    localStorage.removeItem('deskhub_token');
    
    // Dispara evento customizado que AuthContext pode escutar
    window.dispatchEvent(new CustomEvent('auth:token-expired', {
      detail: { message: 'Sua sessão expirou. Por favor, faça login novamente.' }
    }));
    
    // Redireciona para login
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
    
    throw new Error('Session expired');
  }

  return response;
}
