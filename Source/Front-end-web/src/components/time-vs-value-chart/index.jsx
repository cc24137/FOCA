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

export default function GenericLineChart({
  data = [],
  xKey = 'segundo_video',
  yKey = 'media_momento',            
  lineColor = '#4F46E5',     
  lines,                     
  height = 300,
  formatXAxis,
  isAnimationActive = true,
  onClick,
}) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
        Nenhum dado disponível
      </div>
    );
  }

  const chartLines = lines || [
    { key: yKey, color: lineColor, label: yKey }
  ];

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div style={{ width: '100%', height, cursor: onClick ? 'pointer' : 'default' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          onClick={handleClick}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey={xKey} tickFormatter={formatXAxis} />
          <YAxis />
          
          <Tooltip wrapperStyle={{ pointerEvents: 'none' }} />
          
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
              dot={{ r: 4, cursor: onClick ? 'pointer' : 'default' }}
              activeDot={{ 
                r: 7, 
                cursor: onClick ? 'pointer' : 'default',
                onClick: handleClick 
              }}
              onClick={handleClick}
              isAnimationActive={isAnimationActive}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}