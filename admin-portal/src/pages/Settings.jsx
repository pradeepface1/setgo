import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Sun, Moon, Monitor, Globe } from 'lucide-react';


const Settings = () => {
    // Settings component with User Management
    const { theme, timezone, updateTheme, updateTimezone } = useSettings();

    // Local state for changes before saving
    const [selectedTheme, setSelectedTheme] = useState(theme);
    const [selectedTimezone, setSelectedTimezone] = useState(timezone);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        updateTheme(selectedTheme);
        updateTimezone(selectedTimezone);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
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
                        className="px-6 py-2 bg-jubilant-600 text-black font-bold rounded-md hover:bg-jubilant-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jubilant-500 shadow-sm"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
