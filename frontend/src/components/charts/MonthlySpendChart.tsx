import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import Spinner from '../ui/Spinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const MonthlySpendChart: React.FC = () => {
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['report-monthly-spend'],
    queryFn: () => api.reports.monthlySpend()
  });

  const formatYAxis = (tickItem: number) => {
    if (tickItem >= 100000) {
      return `₹${(tickItem / 100000).toFixed(0)} L`;
    }
    return `₹${tickItem.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg backdrop-blur-md shadow-xl text-xs font-semibold">
          <p className="text-slate-400 font-display uppercase tracking-wider">Month: {payload[0].payload.month}</p>
          <p className="text-brand-400 mt-1.5 text-sm font-bold">Spend: ₹{payload[0].value.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-72 flex justify-center items-center">
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="h-72 w-full mt-4 font-sans text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            dy={10}
            fontSize={10}
            fontWeight={600}
          />
          <YAxis
            stroke="#64748b"
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            dx={-10}
            fontSize={10}
            fontWeight={600}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(30, 41, 59, 0.2)' }} />
          <Bar
            dataKey="amount"
            fill="#4f73ff"
            radius={[4, 4, 0, 0]}
            maxBarSize={45}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySpendChart;
