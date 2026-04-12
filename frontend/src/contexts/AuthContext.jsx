import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assim que o site abre, verifica se já tem um token salvo
  useEffect(() => {
    const recoveredToken = localStorage.getItem('deskhub_token');

    if (recoveredToken) {
      // Valida o token no backend e pega os dados do usuário
      fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${recoveredToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token inválido');
      })
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        logout(); // Se der erro (expirou), desloga
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Servidor indisponível. Tente novamente em alguns segundos.');
    }
    
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');

    localStorage.setItem('deskhub_token', data.token);
    setUser(data.user);
  };

  const register = async (name, email, password) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro ao registrar');
    }
  };

  const logout = () => {
    localStorage.removeItem('deskhub_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}