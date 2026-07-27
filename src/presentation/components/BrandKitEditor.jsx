/**
 * BrandKitEditor.jsx
 * Corporate Branding System Editor (Logo, Colors, Fonts, Header/Footer).
 */

import React, { useState } from 'react';
import { Upload, Palette, Building, Save } from 'lucide-react';

export function BrandKitEditor({ brandKit, onSave }) {
  const [formData, setFormData] = useState(brandKit || {
    companyName: 'Acme Corporation',
    primaryColor: '#1A2B4A',
    accentColor: '#F5A800',
    secondaryColor: '#0A7B8C',
    fontFamily: 'Calibri',
    footerText: 'Confidential & Proprietary',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-2xl space-y-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
          <Building size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">Corporate Brand Kit</h3>
          <p className="text-xs text-gray-500">Configure global brand identity tokens used by every slide component.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Company Name</label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Font Stack</label>
          <select
            value={formData.fontFamily}
            onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
            className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-gray-900 dark:text-gray-100"
          >
            <option value="Calibri">Calibri (Constitution Default)</option>
            <option value="Arial">Arial</option>
            <option value="Roboto">Roboto</option>
            <option value="Inter">Inter</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Primary Color (Navy)</label>
          <input
            type="color"
            value={formData.primaryColor}
            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
            className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Accent Color (Gold)</label>
          <input
            type="color"
            value={formData.accentColor}
            onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
            className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Secondary Color (Teal)</label>
          <input
            type="color"
            value={formData.secondaryColor}
            onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
            className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">Footer Disclaimer Text</label>
        <input
          type="text"
          value={formData.footerText}
          onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
          className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-gray-900 dark:text-gray-100"
        />
      </div>

      <button
        type="submit"
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
      >
        <Save size={14} /> Save Brand Kit Tokens
      </button>
    </form>
  );
}
