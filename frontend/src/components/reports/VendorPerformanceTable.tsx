import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import Spinner from '../ui/Spinner';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../ui/Table';
import { Star } from 'lucide-react';

interface VendorPerformance {
  vendorName: string;
  category: string;
  totalPOs: number;
  totalSpend: number;
  avgDeliveryDays: number;
  rating: number;
}

export const VendorPerformanceTable: React.FC = () => {
  const { data, isLoading } = useQuery<VendorPerformance[]>({
    queryKey: ['report-vendor-performance'],
    queryFn: () => api.reports.vendorPerformance()
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  const vendors = data || [];

  return (
    <div className="space-y-4">
      {vendors.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-6">No performance statistics recorded yet.</p>
      ) : (
        <TableContainer>
          <Thead>
            <Tr>
              <Th className="px-4 py-3">Vendor / Category</Th>
              <Th className="px-4 py-3 text-center">Total Orders</Th>
              <Th className="px-4 py-3 text-center">Fulfillment Window</Th>
              <Th className="px-4 py-3">Vendor Score</Th>
              <Th className="px-4 py-3 text-right">Aggregate Spend</Th>
            </Tr>
          </Thead>
          <Tbody>
            {vendors.map((v, index) => (
              <Tr key={index}>
                {/* Vendor name + Category */}
                <Td className="px-4 py-3">
                  <div>
                    <div className="font-bold text-slate-200 text-xs font-display">{v.vendorName}</div>
                    <div className="text-[10px] uppercase text-slate-500 font-bold mt-1 tracking-wider">{v.category}</div>
                  </div>
                </Td>
                {/* Total POs */}
                <Td className="px-4 py-3 text-center font-bold text-slate-300">
                  {v.totalPOs} POs
                </Td>
                {/* Avg Delivery Days */}
                <Td className="px-4 py-3 text-center text-xs text-slate-300 font-semibold">
                  Avg {v.avgDeliveryDays} Days
                </Td>
                {/* Rating score */}
                <Td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500/80" />
                    <span className="text-xs font-bold text-slate-200">{v.rating.toFixed(1)}</span>
                  </div>
                </Td>
                {/* Total Spend */}
                <Td className="px-4 py-3 text-right font-extrabold text-brand-400">
                  ₹{v.totalSpend.toLocaleString()}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </TableContainer>
      )}
    </div>
  );
};

export default VendorPerformanceTable;
