import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function OfflineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wentOffline = () => {
      if (timer) clearTimeout(timer);
      setReconnected(false);
      setOnline(false);
    };
    const wentOnline = () => {
      setOnline(true);
      setReconnected(true);
      timer = setTimeout(() => setReconnected(false), 4000);
    };
    window.addEventListener('offline', wentOffline);
    window.addEventListener('online', wentOnline);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('offline', wentOffline);
      window.removeEventListener('online', wentOnline);
    };
  }, []);

  if (online && !reconnected) return null;
  return (
    <div className={`fixed left-1/2 top-3 z-[105] -translate-x-1/2 rounded-full px-4 py-2 text-label-sm font-semibold shadow-lg ${online ? 'bg-green-700 text-white' : 'bg-amber-500 text-black'}`} role="status">
      <span className="flex items-center gap-2">
        <Icon name={online ? 'cloud_done' : 'cloud_off'} size={16} />
        {online ? 'Conexão voltou — sincronizando alterações' : 'Sem internet — alterações salvas neste aparelho'}
      </span>
    </div>
  );
}
