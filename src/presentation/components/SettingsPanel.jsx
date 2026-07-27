/**
 * SettingsPanel.jsx
 * Presentation Configuration Panel.
 */

import React from 'react';
import { Sliders, Eye, Palette, Layout, Flag, Layers } from 'lucide-react';

export function SettingsPanel({ config, onChangeConfig }) {
  const handleChange = (field, value) => {
    onChangeConfig({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
          <Sliders size={14} /> Purpose & Audience
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Purpose</label>
            <select
              value={config.purpose || 'Executive'}
              onChange={(e) => handleChange('purpose', e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-100"
            >
              <option value="Executive">Executive Overview</option>
              <option value="Board Meeting">Board Meeting</option>
              <option value="Investor">Investor Pitch</option>
              <option value="Sales">Sales Proposal</option>
              <option value="Healthcare">Healthcare & Clinical</option>
              <option value="Research">Research Paper</option>
              <option value="Government">Government / Audit</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Audience</label>
            <select
              value={config.audience || 'Executives'}
              onChange={(e) => handleChange('audience', e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-100"
            >
              <option value="Executives">C-Suite Executives</option>
              <option value="Managers">Department Managers</option>
              <option value="Public">General Public</option>
              <option value="Technical">Technical Experts</option>
              <option value="Students">Academic / Students</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
          <Palette size={14} /> Design System & Theme
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Theme</label>
            <select
              value={config.theme || 'Corporate'}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-100"
            >
              <option value="Corporate">Corporate Navy & Gold (Constitution)</option>
              <option value="Light">Clean Light</option>
              <option value="Dark">Sleek Dark</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Deck Length</label>
            <select
              value={config.length || 'Auto'}
              onChange={(e) => handleChange('length', e.target.value)}
              className="w-full text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-gray-100"
            >
              <option value="Auto">Auto (Dynamic Length)</option>
              <option value="Short">Short (5-7 slides)</option>
              <option value="Medium">Medium (10-15 slides)</option>
              <option value="Detailed">Detailed (20+ slides)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
          <Layers size={14} /> Corporate Branding & Options
        </h4>
        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={config.includeSpeakerNotes !== false}
              onChange={(e) => handleChange('includeSpeakerNotes', e.target.checked)}
              className="rounded text-indigo-600"
            />
            Include Presenter Speaker Notes
          </label>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={config.includeAppendix !== false}
              onChange={(e) => handleChange('includeAppendix', e.target.checked)}
              className="rounded text-indigo-600"
            />
            Include Appendix & Technical Tables
          </label>
        </div>
      </div>
    </div>
  );
}
