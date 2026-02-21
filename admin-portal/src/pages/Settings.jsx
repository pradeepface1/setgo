import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Sun, Moon, Monitor, Globe, FileText } from 'lucide-react';
import LanguageSwitcher from '../components/common/LanguageSwitcher'; // Import Switcher
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/api';


const Settings = () => {
    // Settings component with User Management
    const { theme, timezone, updateTheme, updateTimezone } = useSettings();
    const { user, preferences, login } = useAuth();

    // Local state for changes before saving
    const [selectedTheme, setSelectedTheme] = useState(theme);
    const [selectedTimezone, setSelectedTimezone] = useState(timezone);
    const [receiptConfig, setReceiptConfig] = useState(preferences?.theme || {});
    const [receiptTemplate, setReceiptTemplate] = useState(preferences?.pdfSettings?.slipTemplate || 'STANDARD');
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            updateTheme(selectedTheme);
            updateTimezone(selectedTimezone);

            // If user is Org Admin, save their specific preferences
            if (user?.role === 'ORG_ADMIN') {
                const updatedObj = await organizationService.updateMyPreferences({
                    theme: receiptConfig,
                    pdfSettings: { slipTemplate: receiptTemplate }
                });

                // Update global context so PDF generators instantly see it
                if (updatedObj.preferences) {
                    login({ ...user, organizationPreferences: updatedObj.preferences });
                }
            }

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("Failed to save settings: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const timezones = [
        { value: 'Asia/Kolkata', label: 'India (IST)' },
        { value: 'America/New_York', label: 'New York (EST)' },
        { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
        { value: 'Europe/London', label: 'London (GMT)' },
        { value: 'Europe/Paris', label: 'Paris (CET)' },
        { value: 'Asia/Dubai', label: 'Dubai (GST)' },
        { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
        { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
        { value: 'Pacific/Auckland', label: 'Auckland (NZDT)' },
    ];

    const themeOptions = [
        { value: 'light', label: 'Light', icon: Sun, description: 'Light theme' },
        { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme' },
        { value: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' }
    ];

    return (
        <div className="space-y-6 relative pb-20">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your application preferences</p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {/* Language Selection */}
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Globe className="h-5 w-5 text-gray-400 mr-2" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Language</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select your preferred language</p>
                    <div className="max-w-md">
                        <LanguageSwitcher />
                    </div>
                </div>

                {/* Theme Selection */}
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Sun className="h-5 w-5 text-gray-400 mr-2" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Theme</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choose your preferred theme for the admin portal</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {themeOptions.map((option) => {
                            const Icon = option.icon;
                            // Use selectedTheme for UI state
                            const isSelected = selectedTheme === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => setSelectedTheme(option.value)}
                                    className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-all ${isSelected
                                        ? 'border-jubilant-500 bg-jubilant-50 dark:bg-jubilant-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Icon className={`h-8 w-8 mb-2 ${isSelected ? 'text-jubilant-600' : 'text-gray-400'
                                        }`} />
                                    <span className={`font-medium ${isSelected ? 'text-jubilant-900 dark:text-jubilant-300' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {option.label}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</span>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <div className="h-5 w-5 bg-jubilant-500 rounded-full flex items-center justify-center">
                                                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Timezone Selection */}
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Globe className="h-5 w-5 text-gray-400 mr-2" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Timezone</h2>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select your timezone for accurate time displays</p>

                    <div className="max-w-md">
                        <select
                            value={selectedTimezone}
                            onChange={(e) => setSelectedTimezone(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-jubilant-500 focus:border-jubilant-500 dark:bg-gray-700 dark:text-white"
                        >
                            {timezones.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Current time: {new Date().toLocaleString('en-US', { timeZone: selectedTimezone })}
                        </p>
                    </div>
                </div>

                {/* Slip Formatting */}
                {user?.role === 'ORG_ADMIN' && (
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Slip Formatting (Custom Template)</h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize the exact text that appears on your generated Slips.</p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Global Layout Template</label>
                            <select
                                value={receiptTemplate}
                                onChange={(e) => setReceiptTemplate(e.target.value)}
                                className="block w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-jubilant-500 focus:border-jubilant-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="STANDARD">Standard Default Layout</option>
                                <option value="KARUR_CUSTOM">Karur Detailed Layout</option>
                            </select>
                        </div>

                        {receiptTemplate === 'KARUR_CUSTOM' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Top Slogan</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.slogan || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, slogan: e.target.value })}
                                        placeholder="e.g. ll Sri Murugan Thunai ll"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jubilant-500 focus:border-jubilant-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company Header</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.companyHeader || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, companyHeader: e.target.value })}
                                        placeholder="e.g. N.S. KARUR ROADWAYS"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jubilant-500 focus:border-jubilant-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company Sub-Header</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.companySubHeader || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, companySubHeader: e.target.value })}
                                        placeholder="e.g. TRANSPORT CONTRACTORS & COMMISSION AGENTS"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jubilant-500 focus:border-jubilant-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Line 1 (Right Aligned)</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.phoneLine1 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, phoneLine1: e.target.value })}
                                        placeholder="e.g. Phone : 9448275227, 9739361561"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jubilant-500 focus:border-jubilant-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Line 2 (Right Aligned)</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.phoneLine2 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, phoneLine2: e.target.value })}
                                        placeholder="e.g. 080-28523888, 080-28523777"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jubilant-500 focus:border-jubilant-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 1</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.addressLine1 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, addressLine1: e.target.value })}
                                        placeholder="e.g. # 32, Behind HP Petrol Bunk, Old Chandapura"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jubilant-500 focus:border-jubilant-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line 2</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.addressLine2 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, addressLine2: e.target.value })}
                                        placeholder="e.g. Thirumagondanahalli Cross, Anekal Taluk, Bengaluru - 560099"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-jubilant-500 focus:border-jubilant-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button Area */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-start">
                        <div className="ml-3">
                            {isSaved ? (
                                <span className="text-black dark:text-green-400 font-bold">Settings saved successfully!</span>
                            ) : (
                                <span className="text-black text-sm dark:text-gray-300 font-medium">Click save to apply changes</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-jubilant-600 text-black font-bold rounded-md hover:bg-jubilant-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jubilant-500 shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
