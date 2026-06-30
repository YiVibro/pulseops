import React from 'react';
import type { AnomalyAlert } from '../types';
import { AlertCircle, Terminal, Clock } from 'lucide-react';

interface AlertsPanelProps {
  alerts: AnomalyAlert[];
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
    <div className="bg-[#1f2833]/20 border border-gray-800 rounded-xl p-5 h-[calc(100vh-220px)] flex flex-col">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-800 mb-4">
        <Terminal className="w-4 h-4 text-red-400" />
        <h2 className="text-sm font-bold tracking-widest text-white uppercase">Incident Anomaly Stream</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm gap-2">
            <AlertCircle className="w-5 h-5 text-gray-700" />
            <span>Telemetry baseline nominal. No anomalies.</span>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg border bg-black/40 transition duration-150 flex flex-col gap-2 ${
                alert.severity === 'critical' ? 'border-red-900/50 hover:border-red-800' : 'border-amber-900/50 hover:border-amber-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider font-semibold font-mono ${
                  alert.severity === 'critical' ? 'bg-red-950/60 text-red-400' : 'bg-amber-950/60 text-amber-400'
                }`}>
                  {alert.severity}
                </span>
                <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="text-xs">
                <span className="text-white font-semibold">{alert.serverName}</span> indicated a statistical variance outlier on resource <span className="text-[#45f3ff] font-mono">{alert.metric.toUpperCase()}</span> reaching <span className="font-bold text-white font-mono">{alert.severity}%</span>.
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;