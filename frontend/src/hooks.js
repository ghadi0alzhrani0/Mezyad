import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
export function useResource(endpoint, pollMs = 0) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let active = true,
      controller,
      timer,
      closed = false;
    setState({ data: null, loading: true, error: '' });
    async function load() {
      controller = new AbortController();
      try {
        const data = await api(endpoint, { signal: controller.signal });
        closed =
          data?.status === 'CLOSED' ||
          (data && 'commitment' in data && data.commitment?.status !== 'PENDING');
        if (active) setState({ data, loading: false, error: '' });
      } catch (error) {
        if (active && error.name !== 'AbortError')
          setState((previous) => ({ ...previous, loading: false, error: error.message }));
      }
      if (active && pollMs && !closed) timer = setTimeout(load, pollMs);
    }
    load();
    return () => {
      active = false;
      controller?.abort();
      clearTimeout(timer);
    };
  }, [endpoint, pollMs, version]);
  return { ...state, reload };
}
export function useCountdown(endTime, serverTime) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const offset = serverTime ? new Date(serverTime).getTime() - Date.now() : 0;
    const update = () =>
      setRemaining(
        Math.max(0, Math.ceil((new Date(endTime).getTime() - Date.now() - offset) / 1000))
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endTime, serverTime]);
  return remaining;
}
