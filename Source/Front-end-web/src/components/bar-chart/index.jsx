import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import './bar-chart.css';

export default function GenericBarChart({
  data = [],
  xKey = 'label',
  yKey = 'media',
  barColor = '#4F46E5',
  bars,
  colors = [],
  height = 400,
  formatXAxis,
  formatYAxis,
  isAnimationActive = true,
  barRadius = [8, 8, 0, 0],
}) {
  if (!data || data.length === 0) {
    return <div className="chart-no-data" style={{ height }}>Nenhum dado disponível</div>;
  }

  const processedData = colors.length > 0
    ? data.map((item, index) => ({
        ...item,
        fill: item.fill || colors[index % colors.length] || barColor,
      }))
    : data;

  const chartBars = bars || [
    { key: yKey, color: barColor, label: yKey }
  ];

  return (
    <div className="chart-container" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={formatXAxis} />
          <YAxis tickFormatter={formatYAxis} domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Média de Atenção']}
          />

          {chartBars.length > 1 && <Legend />}

          {chartBars.map((barConfig) => (
            <Bar
              key={barConfig.key}
              dataKey={barConfig.key}
              name={barConfig.label || barConfig.key}
              fill={barConfig.color || barColor}
              radius={barRadius}
              isAnimationActive={isAnimationActive}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}