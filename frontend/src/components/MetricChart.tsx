import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { MetricData } from '../types';

interface MetricChartProps {
  data: MetricData[];
  dataKey: 'cpu' | 'memory' | 'disk';
  color: string;
  label: string;
}

const MetricChart: React.FC<MetricChartProps> = ({ data, dataKey, color, label }) => {
  const formatTime = (tick: number) => {
    return new Date(tick).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-[#1f2833]/30 border border-gray-800 rounded-xl p-5 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">{label} Timeline</h3>
        <span className="text-xs bg-gray-900 border border-gray-800 px-2.5 py-1 rounded text-gray-300 font-mono">
          {data[data.length - 1]?.[dataKey]?.toFixed(1) || 0}% CURRENT
        </span>
      </div>
      
      <div className="h-64 w-full font-mono text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2833" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatTime} 
              stroke="#4a5568" 
              dy={10}
            />
            <YAxis domain={[0, 100]} stroke="#4a5568" dx={-5} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0b0c10', borderColor: '#2d3748', borderRadius: '8px' }}
              labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString()}`}
              formatter={(value: any) => [`${Number(value).toFixed(2)}%`, label]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MetricChart;