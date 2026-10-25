import React, { useCallback, useMemo, useState } from 'react';
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
import './time-vs-value-chart.css';

// Os dados continuam em segundos. A conversão é somente visual.
export function formatTime(seconds, showHours = false) {
  if (seconds === null || seconds === undefined || seconds === '') return '';
  const numericValue = Number(seconds);
  if (!Number.isFinite(numericValue)) return String(seconds);

  const total = Math.max(0, Math.floor(numericValue));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;
  const pad = (value) => String(value).padStart(2, '0');

  return showHours || hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainingSeconds)}`
    : `${pad(minutes)}:${pad(remainingSeconds)}`;
}

export default function GenericLineChart({
  data = [],
  xKey = 'segundo_video',
  yKey = 'media_momento',
  lineColor = 'var(--indigo)',
  lines,
  height = 300,
  formatXAxis,
  formatYAxis,
  yDomain,
  formatTooltipLabel,
  isAnimationActive = true,
  onClick,
  // Outros usos do componente, como nomes de aulas, continuam categóricos.
  isTimeAxis = xKey === 'segundo_video',
  showDots = 'auto',
  minDotSpacing = 18,
}) {
  const [containerWidth, setContainerWidth] = useState(0);
  const handleResize = useCallback((width) => {
    setContainerWidth(Math.round(width));
  }, []);

  const chartData = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    // Ordena uma cópia: não altera o array recebido da tela.
    return isTimeAxis ? [...items].sort((a, b) => a[xKey] - b[xKey]) : items;
  }, [data, isTimeAxis, xKey]);

  const chartLines = lines || [
    { key: yKey, color: lineColor, label: yKey },
  ];

  // Desconta o eixo Y (60 px) e a margem direita (20 px).
  const plotWidth = Math.max(0, containerWidth - 80);
  const { pointSpacing, showHours } = useMemo(() => {
    if (!isTimeAxis) {
      return {
        pointSpacing: plotWidth / Math.max(1, chartData.length - 1),
        showHours: false,
      };
    }

    let minTime = Infinity;
    let maxTime = -Infinity;
    let minInterval = Infinity;
    let previousTime;

    for (const item of chartData) {
      const time = item[xKey];
      if (!Number.isFinite(time)) continue;
      minTime = Math.min(minTime, time);
      maxTime = Math.max(maxTime, time);
      if (previousTime !== undefined) {
        minInterval = Math.min(minInterval, time - previousTime);
      }
      previousTime = time;
    }

    const duration = maxTime - minTime;
    return {
      pointSpacing: duration > 0 ? (minInterval / duration) * plotWidth : 0,
      showHours: maxTime >= 3600,
    };
  }, [chartData, isTimeAxis, plotWidth, xKey]);

  const dotsVisible = showDots === 'auto'
    ? chartData.length === 1 || (plotWidth > 0 && pointSpacing >= minDotSpacing)
    : Boolean(showDots);

  const tickFormatter = formatXAxis || (isTimeAxis
    ? (value) => formatTime(value, showHours)
    : undefined);
  const labelFormatter = formatTooltipLabel || (isTimeAxis
    ? (value) => `Tempo: ${tickFormatter(value)}`
    : tickFormatter);

  if (chartData.length === 0) {
    return (
      <div className="foca-line-chart foca-line-chart--empty" style={{ height }}>
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div
      className="foca-line-chart"
      style={{ height, cursor: onClick ? 'pointer' : 'default' }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0} onResize={handleResize}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          onClick={onClick}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey={xKey}
            type={isTimeAxis ? 'number' : 'category'}
            domain={isTimeAxis ? ['dataMin', 'dataMax'] : undefined}
            allowDecimals={isTimeAxis ? false : undefined}
            tickFormatter={tickFormatter}
            tickCount={isTimeAxis ? Math.max(2, Math.floor(plotWidth / (showHours ? 110 : 85))) : undefined}
            interval="preserveStartEnd"
            minTickGap={24}
            tick={{ fontSize: 12, fill: 'var(--slate-700)' }}
            tickMargin={10}
            height={40}
          />
          <YAxis width={60} tickFormatter={formatYAxis} {...(yDomain ? { domain: yDomain } : {})} />
          <Tooltip
            labelFormatter={labelFormatter}
            formatter={formatYAxis ? (value, name) => [formatYAxis(value), name] : undefined}
            wrapperStyle={{ pointerEvents: 'none', maxWidth: '100%' }}
            cursor={{ stroke: 'var(--text-subtle)', strokeDasharray: '4 4' }}
          />
          {chartLines.length > 1 && <Legend />}

          {chartLines.map((lineConfig) => (
            <Line
              key={lineConfig.key}
              type="monotone"
              dataKey={lineConfig.key}
              name={lineConfig.label || lineConfig.key}
              stroke={lineConfig.color || lineColor}
              strokeWidth={3}
              connectNulls={true}
              dot={dotsVisible ? { r: 4 } : false}
              activeDot={{ r: 6, strokeWidth: 2, cursor: onClick ? 'pointer' : 'default' }}
              isAnimationActive={isAnimationActive}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
