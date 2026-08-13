import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import './time-vs-value.css';

export default function GenericLineChart({
  data = [],
  xKey = 'tempoFormatado',
  yKey = 'temp',            
  lineColor = '#4F46E5',     
  lines,                     
  height = 400,
  formatXAxis,
  isAnimationActive = true,
}) {
  if (!data || data.length === 0) {
    return <div className="chart-no-data" style={{ height }}>Nenhum dado disponível</div>;
  }

  const chartLines = lines || [
    { key: yKey, color: lineColor, label: yKey }
  ];

  return (
    <div className="chart-container" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xKey} tickFormatter={formatXAxis} />
          <YAxis />
          <Tooltip />
          
          {chartLines.length > 1 && <Legend />}

          {chartLines.map((lineConfig) => (
            <Line
              key={lineConfig.key}
              type="monotone"
              dataKey={lineConfig.key}
              name={lineConfig.label || lineConfig.key}
              stroke={lineConfig.color || '#4F46E5'}
              strokeWidth={3}
              connectNulls={true} 
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              isAnimationActive={isAnimationActive}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}