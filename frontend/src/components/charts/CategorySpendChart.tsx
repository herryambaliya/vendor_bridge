import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import Spinner from '../ui/Spinner';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  IT: '#4f73ff', // Brand Indigo
  Furniture: '#f59e0b', // Amber
  Logistics: '#10b981', // Emerald
  Stationery: '#ec4899', // Pink
  Other: '#64748b' // Slate
};

export const CategorySpendChart: React.FC = () => {
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['report-category-spend'],
    queryFn: () => api.reports.categorySpend()
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg backdrop-blur-md shadow-xl text-xs font-semibold">
          <p className="text-slate-200 font-display uppercase tracking-wider">{payload[0].name}</p>
          <p className="text-brand-400 mt-1 text-sm font-bold">Value: ₹{payload[0].value.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col gap-2 font-sans text-xs text-slate-400 font-semibold justify-center">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate max-w-[150px]">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  if (isLoading) {
    return (
      <div className="h-72 flex justify-center items-center">
        <Spinner size="sm" />
      </div>
    );
  }

  const chartData = data || [];

  return (
    <div className="h-72 w-full mt-4 flex items-center justify-between">
      <div className="h-full flex-1 min-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const color = COLORS[entry.name as keyof typeof COLORS] || COLORS.Other;
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-44 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Legend layout="vertical" verticalAlign="middle" align="right" content={renderLegend} />
            <Pie data={[{ name: '', value: 1 }]} dataKey="value" opacity={0} /> {/* invisible pie just to draw legend */}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CategorySpendChart;
