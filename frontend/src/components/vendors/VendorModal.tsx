import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../../lib/api';
import { showToast } from '../ui/Toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendorId?: string | null; // If passed, we edit the vendor
}

interface VendorFormInputs {
  name: string;
  category: string;
  gstNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: 'active' | 'inactive' | 'blacklisted';
}

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vendorId
}) => {
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<VendorFormInputs>({
    defaultValues: {
      status: 'active'
    }
  });
  const [isLoading, setIsLoading] = React.useState(false);

  // Load vendor data if editing
  useEffect(() => {
    if (isOpen && vendorId) {
      const fetchVendor = async () => {
        setIsLoading(true);
        try {
          const v = await api.vendors.get(vendorId);
          setValue('name', v.name);
          setValue('category', v.category);
          setValue('gstNumber', v.gstNumber);
          setValue('contactName', v.contactName);
          setValue('contactEmail', v.contactEmail);
          setValue('contactPhone', v.contactPhone);
          setValue('address', v.address);
          setValue('status', v.status);
        } catch (err: any) {
          showToast.error('Failed to load vendor details');
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchVendor();
    } else {
      reset({
        status: 'active',
        name: '',
        category: 'IT',
        gstNumber: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        address: ''
      });
    }
  }, [isOpen, vendorId, setValue, reset, onClose]);

  const onSubmit = async (data: VendorFormInputs) => {
    setIsLoading(true);
    try {
      if (vendorId) {
        await api.vendors.update(vendorId, data);
        showToast.success('Vendor profile updated successfully!');
      } else {
        await api.vendors.create(data);
        showToast.success('Vendor registered successfully!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || err?.message || 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vendorId ? 'Edit Vendor Supplier' : 'Register New Vendor Supplier'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-300">Company Name</label>
            <input
              type="text"
              className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              placeholder="e.g. FurniCo Industries"
              {...register('name', { required: 'Company name is required' })}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.name.message}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-300">Category</label>
            <select
              className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              {...register('category', { required: 'Category is required' })}
            >
              <option value="IT">Information Technology (IT)</option>
              <option value="Furniture">Furniture & Fittings</option>
              <option value="Logistics">Logistics & Transport</option>
              <option value="Stationery">Office Stationery</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GST */}
          <div>
            <label className="block text-sm font-semibold text-slate-300">GST Registration Number</label>
            <input
              type="text"
              className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              placeholder="e.g. 27ABCDE1234F1Z5"
              {...register('gstNumber', {
                required: 'GST number is required',
                pattern: {
                  value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                  message: 'Invalid Indian GSTIN format'
                }
              })}
            />
            {errors.gstNumber && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.gstNumber.message}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-300">Vendor Status</label>
            <select
              className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
              {...register('status', { required: 'Status is required' })}
            >
              <option value="active">Active Onboarded</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted / Suspended</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-4 mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Primary Contact Point</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contact Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="Rajesh Kumar"
                {...register('contactName', { required: 'Contact name is required' })}
              />
              {errors.contactName && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.contactName.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="sales@company.com"
                {...register('contactEmail', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email'
                  }
                })}
              />
              {errors.contactEmail && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.contactEmail.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-300">Phone Number</label>
              <input
                type="text"
                className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="+91 98765 43210"
                {...register('contactPhone', { required: 'Phone number is required' })}
              />
              {errors.contactPhone && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.contactPhone.message}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-slate-300">Corporate Address</label>
          <textarea
            rows={3}
            className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
            placeholder="Complete postal address..."
            {...register('address', { required: 'Corporate address is required' })}
          />
          {errors.address && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.address.message}</p>}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {vendorId ? 'Save Changes' : 'Register Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VendorModal;
