import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Sun, Moon, Monitor, Globe } from 'lucide-react';


const Settings = () => {
    // Settings component with User Management
    const { theme, timezone, updateTheme, updateTimezone } = useSettings();


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
        <div className="space-y-6 relative">




            <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your application preferences</p>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {/* User Management */}


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
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => updateTheme(option.value)}
                                    className={`relative flex flex-col items-center p-4 border-2 rounded-lg transition-all ${theme === option.value
                                        ? 'border-jubilant-500 bg-jubilant-50 dark:bg-jubilant-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <Icon className={`h-8 w-8 mb-2 ${theme === option.value ? 'text-jubilant-600' : 'text-gray-400'
                                        }`} />
                                    <span className={`font-medium ${theme === option.value ? 'text-jubilant-900 dark:text-jubilant-300' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {option.label}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</span>
                                    {theme === option.value && (
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
                            value={timezone}
                            onChange={(e) => updateTimezone(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-jubilant-500 focus:border-jubilant-500 dark:bg-gray-700 dark:text-white"
                        >
                            {timezones.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Current time: {new Date().toLocaleString('en-US', { timeZone: timezone })}
                        </p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Settings are saved automatically</h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Your preferences are stored locally in your browser and will persist across sessions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
