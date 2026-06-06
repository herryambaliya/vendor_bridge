import React from 'react';

interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> { }

export const TableContainer: React.FC<TableContainerProps> = ({ children, className = '', ...props }) => (
  <div className={`w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.01)] ${className}`} {...props}>
    <table className="w-full text-left border-collapse">
      {children}
    </table>
  </div>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <thead className={`bg-slate-50/75 border-b border-slate-100 ${className}`} {...props}>
    {children}
  </thead>
);

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className = '', ...props }) => (
  <tbody className={`divide-y divide-slate-50 bg-transparent ${className}`} {...props}>
    {children}
  </tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className = '', ...props }) => (
  <tr className={`hover:bg-slate-50/50 transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 font-display ${className}`} {...props}>
    {children}
  </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className = '', ...props }) => (
  <td className={`px-6 py-4 text-sm text-slate-600 font-semibold font-sans ${className}`} {...props}>
    {children}
  </td>
);
