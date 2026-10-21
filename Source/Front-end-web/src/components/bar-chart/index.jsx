import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
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
  formatTooltipLabel,
  isAnimationActive = true,
  barRadius = [8, 8, 0, 0],
  // Use 0 para desativar a rolagem e comprimir todas as barras na tela.
  minCategoryWidth = 28,
}) {
  const [tooltipLayout, setTooltipLayout] = useState(null);

  // O Recharts considera a largura do canvas inteiro. Limita a caixinha
  // à parte visível, inclusive depois de rolar horizontalmente.
  const handleTooltipPosition = (event) => {
    const viewport = event.currentTarget;
    const pointer = event.touches ? event.touches[0] : event;
    if (!pointer) return;
    const width = Math.max(1, Math.min(260, viewport.clientWidth - 16));
    const pointerX = pointer.clientX - viewport.getBoundingClientRect().left;
    const x = viewport.scrollLeft + Math.max(8, Math.min(pointerX + 12, viewport.clientWidth - width - 8));
    setTooltipLayout({ x, width });
  };

  if (!data || data.length === 0) {
    return (
      <div className="foca-bar-chart foca-bar-chart--empty" style={{ height }}>
        Nenhum dado disponível
      </div>
    );
  }

  const processedData = colors.length > 0
    ? data.map((item, index) => ({
        ...item,
        fill: item.fill || colors[index % colors.length] || barColor,
      }))
    : data;

  const chartBars = bars || [
    { key: yKey, color: barColor, label: 'Média de Atenção' },
  ];
  const categoryWidth = Math.max(minCategoryWidth, chartBars.length * 12 + 12);
  const minWidth = minCategoryWidth > 0 ? data.length * categoryWidth + 80 : 0;

  return (
    <div
      className="foca-bar-chart"
      tabIndex={minWidth > 0 ? 0 : undefined}
      role="region"
      aria-label="Gráfico de barras. Quando houver muitas categorias, role horizontalmente para ver todas."
      onMouseMove={handleTooltipPosition}
      onTouchStart={handleTooltipPosition}
      onTouchMove={handleTooltipPosition}
      onScroll={() => setTooltipLayout(null)}
    >
      <div className="foca-bar-chart__canvas" style={{ height, minWidth }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
            <XAxis
              dataKey={xKey}
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
              minTickGap={24}
              tickMargin={10}
              height={45}
              tick={{ fontSize: 12, fill: '#374151' }}
            />
            <YAxis width={60} tickFormatter={formatYAxis} domain={[0, 100]} />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={(value, name) => [formatYAxis ? formatYAxis(value) : `${value}%`, name]}
              active={tooltipLayout ? undefined : false}
              position={tooltipLayout ? { x: tooltipLayout.x, y: 16 } : undefined}
              isAnimationActive={false}
              wrapperStyle={{ pointerEvents: 'none', width: tooltipLayout?.width, maxWidth: '100%' }}
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
              >
                {colors.length > 0 && processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
