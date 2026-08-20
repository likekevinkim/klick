// components/chat/SampleTrackingModal.jsx
'use client';

import { useState, useEffect } from 'react';
import { Truck, X, PackageCheck } from 'lucide-react';

export default function SampleTrackingModal({ isOpen, onClose, room, trackingMsg, userRole, onUpdateTracking }) {
  const [courierCompany, setCourierCompany] = useState('');
  const [trackingNo, setTrackingNo] = useState('');

  // Viewing a specific past shipment message is always read-only, even for the seller
  const isViewingRecord = !!trackingMsg;

  useEffect(() => {
    if (trackingMsg?.file) {
      setCourierCompany(trackingMsg.file.courier || '');
      setTrackingNo(trackingMsg.file.trackingNo || '');
    } else if (room) {
      setCourierCompany(room.courier || '');
      setTrackingNo(room.tracking_no || '');
    }
  }, [room, trackingMsg]);

  if (!isOpen || !room) return null;

  const handleSave = () => {
    onUpdateTracking(room.id, courierCompany, trackingNo);
    alert(`Tracking info updated for [${room.product_title}]: ${courierCompany} [${trackingNo}]`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-6 animate-fadeIn">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-500" />
              {isViewingRecord ? 'Shipment Update' : 'Send Shipping Update'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Shipping status for: <span className="font-bold text-slate-800">{room.product_title}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
            <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
              <PackageCheck className="w-4 h-4 text-amber-600" /> Air Express Dispatch Status
            </span>
            
            <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Courier</span>
                <span className="font-bold text-slate-900">{courierCompany}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tracking Number</span>
                <span className="font-bold text-blue-600">{trackingNo}</span>
              </div>
            </div>
          </div>

          {userRole === 'seller' && !isViewingRecord ? (
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-xs font-bold text-slate-700">Enter Tracking Information:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={courierCompany}
                  onChange={(e) => setCourierCompany(e.target.value)}
                  placeholder="Courier (e.g., DHL, FedEx)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="Tracking Number"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none font-bold"
                />
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
              ℹ️ Copy the tracking number above and check live dispatch progress on the official courier website.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>

          {userRole === 'seller' && !isViewingRecord && (
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              Send Shipping Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}