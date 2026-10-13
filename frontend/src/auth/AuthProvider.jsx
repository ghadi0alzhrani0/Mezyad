import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ApiError, requestApi } from '../api.js';
import { clearStoredSession, readSession, saveSession, validSession } from './session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [status, setStatus] = useState(() => session ? 'checking' : 'guest');
  const [notice, setNotice] = useState('');
  const current = useRef(session);
  const checking = useRef(null);

  const forget = useCallback(message => {
    current.current = null;
    setSession(null);
    setStatus('guest');
    clearStoredSession();
    setNotice(message);
  }, []);

  const verifySession = useCallback(async () => {
    const saved = current.current;
    if (!saved) return;
    checking.current?.abort();
    const controller = new AbortController();
    checking.current = controller;
    setStatus('checking');
    try {
      // Reuse the documented protected endpoint instead of inventing an auth API.
      const ownItems = await requestApi('/api/v1/me/items', { token: saved.token, signal: controller.signal });
      if (!Array.isArray(ownItems)) throw new ApiError('INVALID_RESPONSE');
      if (current.current?.token === saved.token && !controller.signal.aborted) setStatus('authenticated');
    } catch (error) {
      if (controller.signal.aborted || current.current?.token !== saved.token) return;
      if (error.status === 401) forget('انتهت جلسة الدخول. سجّل الدخول مجددًا.');
      else setStatus('unavailable');
    }
  }, [forget]);

  useEffect(() => {
    verifySession();
    return () => checking.current?.abort();
  }, [verifySession]);

  const signIn = useCallback(async (email, password) => {
    const data = await requestApi('/api/v1/auth/login', { method: 'POST', body: { email, password } });
    if (!validSession(data)) throw new ApiError('INVALID_RESPONSE');
    checking.current?.abort();
    current.current = data;
    setSession(data);
    setStatus('authenticated');
    setNotice(saveSession(data) ? 'تم تسجيل الدخول.' : 'تم تسجيل الدخول. تعذر حفظ الجلسة لتحديث الصفحة.');
  }, []);

  const signOut = useCallback(async () => {
    const saved = current.current;
    if (!saved) return;
    try {
      const data = await requestApi('/api/v1/auth/logout', { method: 'POST', token: saved.token });
      if (data?.signedOut !== true) throw new ApiError('INVALID_RESPONSE');
      if (current.current?.token === saved.token) forget('تم تسجيل الخروج.');
    } catch (error) {
      if (current.current?.token !== saved.token) return;
      if (error.status === 401) forget('انتهت جلسة الدخول. سجّل الدخول مجددًا.');
      else throw error; // Do not claim server-side logout when the request failed.
    }
  }, [forget]);

  const request = useCallback(async (path, options = {}) => {
    const token = status === 'authenticated' ? session?.token : undefined;
    try { return await requestApi(path, { ...options, token }); }
    catch (error) {
      if (token && error.status === 401 && current.current?.token === token) {
        forget('انتهت جلسة الدخول. سجّل الدخول مجددًا.');
      }
      throw error;
    }
  }, [session, status, forget]);

  return <AuthContext.Provider value={{ session, status, notice, signIn, signOut, request, verifySession }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requires AuthProvider');
  return value;
}
