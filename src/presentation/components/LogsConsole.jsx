/**
 * LogsConsole.jsx
 * Real-Time Pipeline Console Log View with timestamps.
 */

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export function LogsConsole({ logs = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-950 text-gray-200 font-mono text-xs rounded-xl p-4 border border-gray-800 shadow-2xl flex flex-col h-48">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-2 shrink-0">
        <span className="flex items-center gap-1.5 text-gray-400 font-semibold">
          <Terminal size={14} className="text-indigo-400" /> Pipeline Console Logs
        </span>
        <span className="text-[10px] text-gray-500">{logs.length} events logged</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono">
        {logs.length === 0 ? (
          <p className="text-gray-600 italic">Waiting for pipeline execution...</p>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-gray-600 text-[10px] select-none">[{log.time}]</span>
              <span className={log.type === 'error' ? 'text-red-400' : (log.type === 'success' ? 'text-emerald-400' : 'text-gray-300')}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
