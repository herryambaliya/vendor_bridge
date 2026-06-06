import React from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { showToast } from '../ui/Toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface QuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rfqId: string;
  vendorId: string;
  totalItemsQuantity: number;
}

interface QuotationFormInputs {
  unitPrice: number;
  deliveryDays: number;
  notes: string;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  rfqId,
  vendorId,
  totalItemsQuantity
}) => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<QuotationFormInputs>({
    defaultValues: {
      deliveryDays: 7
    }
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Watch unit price to show estimated total pricing live
  const unitPrice = watch('unitPrice') || 0;
  const estimatedTotal = unitPrice * totalItemsQuantity;

  const onSubmit = async (data: QuotationFormInputs) => {
    setIsLoading(true);
    try {
      const payload = {
        rfqId,
        vendorId,
        unitPrice: parseFloat(data.unitPrice.toString()),
        totalPrice: estimatedTotal,
        deliveryDays: parseInt(data.deliveryDays.toString()),
        notes: data.notes
      };

      await api.quotations.submit(payload);
      showToast.success('Quotation submitted successfully!');
      onSuccess();
      onClose();
      reset();
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit quotation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Bidding Quotation"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-lg text-xs text-slate-300 font-medium">
          Total Quantities requested: <span className="font-bold text-white">{totalItemsQuantity} units</span>.
          Your total quote value will be calculated based on unit price.
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Unit Price (₹ per unit)</label>
          <div className="mt-1.5 relative">
            <span className="absolute left-3 top-2 text-slate-500 text-sm">₹</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
              placeholder="e.g. 4500"
              {...register('unitPrice', {
                required: 'Unit price is required',
                min: { value: 0.01, message: 'Price must be greater than zero' }
              })}
            />
            {errors.unitPrice && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.unitPrice.message}</p>}
          </div>
        </div>

        {/* Delivery Days */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Estimated Delivery Time (Days)</label>
          <input
            type="number"
            min={1}
            className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm text-center"
            placeholder="e.g. 7"
            {...register('deliveryDays', {
              required: 'Delivery days is required',
              min: { value: 1, message: 'Must be at least 1 day' }
            })}
          />
          {errors.deliveryDays && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.deliveryDays.message}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Quotation Notes / Terms</label>
          <textarea
            rows={3}
            className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
            placeholder="Specify warranties, validity terms, shipping inclusions..."
            {...register('notes')}
          />
        </div>

        {/* Live Calculation display */}
        {estimatedTotal > 0 && (
          <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800/80">
            <span className="text-xs font-semibold text-slate-400 font-display uppercase">Estimated Total Quote Value</span>
            <span className="text-md font-extrabold text-brand-400 font-sans">
              ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Submit Quote
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuotationForm;
