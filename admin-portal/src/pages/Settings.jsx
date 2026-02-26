import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Globe, FileText, Type, Palette } from 'lucide-react';
import LanguageSwitcher from '../components/common/LanguageSwitcher'; // Import Switcher
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/api';


const Settings = () => {
    // Settings component with User Management
    const { timezone, updateTimezone, font, updateFont, activeTheme, updateActiveTheme } = useSettings();
    const { user, preferences, login } = useAuth();

    // Local state for changes before saving
    const [selectedTimezone, setSelectedTimezone] = useState(timezone);
    const [selectedFont, setSelectedFont] = useState(font);
    const [selectedTheme, setSelectedTheme] = useState(activeTheme);
    const [receiptConfig, setReceiptConfig] = useState(preferences?.theme || {});
    const [receiptTemplate, setReceiptTemplate] = useState(preferences?.pdfSettings?.slipTemplate || 'STANDARD');

    // Logo State
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(user?.organizationLogo ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${user.organizationLogo}` : null);
    const logoInputRef = React.useRef(null);

    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const themeFontMap = {
        'midnight-neon': 'Inter',
        'arctic-frost': 'Outfit',
        'cyber-industrial': 'JetBrains Mono',
        'deep-forest': 'Montserrat',
        'royal-velvet': 'Orbitron'
    };

    const handleThemeChange = (newTheme) => {
        setSelectedTheme(newTheme);
        updateActiveTheme(newTheme); // Live Preview

        // Match font to theme automatically
        const recommendedFont = themeFontMap[newTheme];
        if (recommendedFont) {
            handleFontChange(recommendedFont);
        }
    };

    const handleFontChange = (newFont) => {
        setSelectedFont(newFont);
        updateFont(newFont); // Live Preview
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            updateTimezone(selectedTimezone);
            updateFont(selectedFont);
            updateActiveTheme(selectedTheme);

            // PERSISTENCE
            localStorage.setItem('timezone', selectedTimezone);
            localStorage.setItem('font', selectedFont);
            localStorage.setItem('activeTheme', selectedTheme);

            // If user is Org Admin, save their specific preferences
            if (user?.role === 'ORG_ADMIN') {
                // ... (existing code for org admin)
                const updatedObj = await organizationService.updateMyPreferences({
                    theme: receiptConfig,
                    pdfSettings: { slipTemplate: receiptTemplate }
                });

                // Update global context so PDF generators instantly see it
                let updatedPreferences = updatedObj.preferences;
                let updatedLogo = user.organizationLogo;

                // Handle logo upload if a new file was selected
                if (logoFile && user.organizationId) {
                    try {
                        const uploadResult = await organizationService.uploadLogo(user.organizationId, logoFile);
                        if (uploadResult.logo) {
                            updatedLogo = uploadResult.logo;
                        }
                    } catch (logoErr) {
                        console.warn('Logo upload from Settings failed:', logoErr);
                    }
                }

                login({
                    ...user,
                    organizationPreferences: updatedPreferences,
                    organizationLogo: updatedLogo
                });
                setLogoFile(null); // clear staging after successful save
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

    const fonts = [
        { value: 'Inter', label: 'Inter (Professional)' },
        { value: 'Outfit', label: 'Outfit (Modern)' },
        { value: 'Montserrat', label: 'Montserrat (Classic)' },
        { value: 'Exo 2', label: 'Exo 2 (Speed)' },
        { value: 'Orbitron', label: 'Orbitron (Futuristic)' },
        { value: 'Kanit', label: 'Kanit (Bold)' },
        { value: 'Barlow', label: 'Barlow (Industrial)' },
        { value: 'JetBrains Mono', label: 'JetBrains Mono (Technical)' },
    ];

    const themes = [
        { id: 'midnight-neon', name: 'Midnight Neon', color: '#4f46e5', desc: 'Default dark mode' },
        { id: 'arctic-frost', name: 'Arctic Frost', color: '#0ea5e9', desc: 'Minimalist light' },
        { id: 'cyber-industrial', name: 'Cyber Industrial', color: '#f59e0b', desc: 'Rugged amber' },
        { id: 'deep-forest', name: 'Deep Forest', color: '#10b981', desc: 'Modern teal' },
        { id: 'royal-velvet', name: 'Royal Velvet', color: '#7c3aed', desc: 'Executive plum' },
    ];


    return (
        <div className="space-y-6 relative pb-20">
            <div>
                <h1 className="text-2xl font-semibold transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Settings</h1>
                <p className="mt-1 text-sm transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Manage your application preferences</p>
            </div>

            <div
                className="shadow rounded-xl divide-y transition-colors duration-500 overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
            >
                {/* Language Selection */}
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Globe className="h-5 w-5 mr-2 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                        <h2 className="text-lg font-medium transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Language</h2>
                    </div>
                    <p className="text-sm mb-4 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Select your preferred language</p>
                    <div className="max-w-md">
                        <LanguageSwitcher />
                    </div>
                </div>


                {/* Timezone Selection */}
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Globe className="h-5 w-5 mr-2 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                        <h2 className="text-lg font-medium transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Timezone</h2>
                    </div>
                    <p className="text-sm mb-4 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Select your timezone for accurate time displays</p>

                    <div className="max-w-md">
                        <select
                            value={selectedTimezone}
                            onChange={(e) => setSelectedTimezone(e.target.value)}
                            className="block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-300 text-xs font-bold uppercase tracking-widest"
                            style={{
                                backgroundColor: 'var(--theme-bg-sidebar)',
                                color: 'var(--theme-text-main)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                '--tw-ring-color': 'var(--theme-primary)'
                            }}
                        >
                            {timezones.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {tz.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Theme Selection */}
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Palette className="h-5 w-5 mr-2 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                        <h2 className="text-lg font-medium transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Branding & Themes</h2>
                    </div>
                    <p className="text-sm mb-6 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Select a premium color palette for your dashboard</p>

                    <div className="max-w-md">
                        <select
                            value={selectedTheme}
                            onChange={(e) => handleThemeChange(e.target.value)}
                            className="block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-300 text-xs font-bold uppercase tracking-widest"
                            style={{
                                backgroundColor: 'var(--theme-bg-sidebar)',
                                color: 'var(--theme-text-main)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                '--tw-ring-color': 'var(--theme-primary)'
                            }}
                        >
                            {themes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name} - {t.desc}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Typography Selection */}
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <Type className="h-5 w-5 mr-2 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                        <h2 className="text-lg font-medium transition-colors duration-500" style={{ color: 'var(--theme-text-main)' }}>Typography</h2>
                    </div>
                    <p className="text-sm mb-6 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>Select the overall font style for the portal</p>

                    <div className="max-w-md">
                        <select
                            value={selectedFont}
                            onChange={(e) => handleFontChange(e.target.value)}
                            className="block w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-300 text-xs font-bold uppercase tracking-widest"
                            style={{
                                backgroundColor: 'var(--theme-bg-sidebar)',
                                color: 'var(--theme-text-main)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                '--tw-ring-color': 'var(--theme-primary)',
                                fontFamily: `'${selectedFont}', sans-serif`
                            }}
                        >
                            {fonts.map((f) => (
                                <option key={f.value} value={f.value} style={{ fontFamily: `'${f.value}', sans-serif` }}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Organization Branding & Slip Formatting */}
            {user?.role === 'ORG_ADMIN' && (
                <div
                    className="shadow rounded-lg divide-y mt-6 transition-colors duration-500"
                    style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                    {/* Organization Logo */}
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <Palette className="h-5 w-5 mr-2 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                            <h2 className="text-lg font-medium" style={{ color: 'var(--theme-text-main)' }}>Organization Branding</h2>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Upload your organization's logo.</p>

                        <div className="flex items-start space-x-6">
                            <div className="flex-shrink-0">
                                {logoPreview ? (
                                    <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                        <img
                                            src={logoPreview}
                                            alt="Preview"
                                            className="h-24 w-24 object-contain rounded-xl border-2 border-dashed bg-white/5 p-2 transition-all group-hover:border-theme-primary/50"
                                            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                                            <span className="text-xs font-medium text-white">Change</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => logoInputRef.current?.click()}
                                        className="h-24 w-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-white/5"
                                        style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                                    >
                                        <span className="text-xs mt-2 opacity-70" style={{ color: 'var(--theme-text-main)' }}>Upload Logo</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    ref={logoInputRef}
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setLogoFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => setLogoPreview(reader.result);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <p className="text-xs opacity-70 mt-2 max-w-sm" style={{ color: 'var(--theme-text-muted)' }}>
                                    Recommended format: PNG with transparent background. Max size: 2MB. Logo will automatically be applied upon saving.
                                </p>
                                {logoFile && (
                                    <button
                                        onClick={() => {
                                            setLogoFile(null);
                                            setLogoPreview(user?.organizationLogo ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${user.organizationLogo}` : null);
                                            if (logoInputRef.current) logoInputRef.current.value = '';
                                        }}
                                        className="mt-3 text-xs text-red-500 hover:text-red-400 font-medium transition-colors"
                                    >
                                        Remove unsaved changes
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <FileText className="h-5 w-5 mr-2 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                            <h2 className="text-lg font-medium" style={{ color: 'var(--theme-text-main)' }}>Slip Formatting (Custom Template)</h2>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--theme-text-muted)' }}>Customize the exact text that appears on your generated Slips.</p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-main)' }}>Global Layout Template</label>
                            <select
                                value={receiptTemplate}
                                onChange={(e) => setReceiptTemplate(e.target.value)}
                                className="block w-full max-w-md px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-300"
                                style={{
                                    backgroundColor: 'var(--theme-bg-sidebar)',
                                    color: 'var(--theme-text-main)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                    '--tw-ring-color': 'var(--theme-primary)'
                                }}
                            >
                                <option value="STANDARD">Standard Default Layout</option>
                                <option value="KARUR_CUSTOM">Karur Detailed Layout</option>
                            </select>
                        </div>

                        {receiptTemplate === 'KARUR_CUSTOM' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text-main)' }}>Top Slogan</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.slogan || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, slogan: e.target.value })}
                                        placeholder="e.g. ll Sri Murugan Thunai ll"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 text-sm transition-all duration-300"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-sidebar)',
                                            color: 'var(--theme-text-main)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text-main)' }}>Company Header</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.companyHeader || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, companyHeader: e.target.value })}
                                        placeholder="e.g. N.S. KARUR ROADWAYS"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 text-sm font-bold transition-all duration-300"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-sidebar)',
                                            color: 'var(--theme-text-main)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text-main)' }}>Company Sub-Header</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.companySubHeader || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, companySubHeader: e.target.value })}
                                        placeholder="e.g. TRANSPORT CONTRACTORS & COMMISSION AGENTS"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 text-sm transition-all duration-300"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-sidebar)',
                                            color: 'var(--theme-text-main)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text-main)' }}>Phone Line 1 (Right Aligned)</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.phoneLine1 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, phoneLine1: e.target.value })}
                                        placeholder="e.g. Phone : 9448275227, 9739361561"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 text-sm transition-all duration-300"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-sidebar)',
                                            color: 'var(--theme-text-main)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text-main)' }}>Phone Line 2 (Right Aligned)</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.phoneLine2 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, phoneLine2: e.target.value })}
                                        placeholder="e.g. 080-28523888, 080-28523777"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 text-sm transition-all duration-300"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-sidebar)',
                                            color: 'var(--theme-text-main)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text-main)' }}>Address Line 1</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.addressLine1 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, addressLine1: e.target.value })}
                                        placeholder="e.g. # 32, Behind HP Petrol Bunk, Old Chandapura"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 text-sm transition-all duration-300"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-sidebar)',
                                            color: 'var(--theme-text-main)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--theme-text-main)' }}>Address Line 2</label>
                                    <input
                                        type="text"
                                        value={receiptConfig.addressLine2 || ''}
                                        onChange={(e) => setReceiptConfig({ ...receiptConfig, addressLine2: e.target.value })}
                                        placeholder="e.g. Thirumagondanahalli Cross, Anekal Taluk, Bengaluru - 560099"
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 text-sm transition-all duration-300"
                                        style={{
                                            backgroundColor: 'var(--theme-bg-sidebar)',
                                            color: 'var(--theme-text-main)',
                                            borderColor: 'rgba(255,255,255,0.1)',
                                            '--tw-ring-color': 'var(--theme-primary)'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save Button Area (Always at bottom) */}
            <div
                className="shadow rounded-lg mt-6 transition-colors duration-500 overflow-hidden"
                style={{ backgroundColor: 'var(--theme-bg-card)' }}
            >
                <div
                    className="p-6 flex items-center justify-between border-t"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
                >
                    <div className="flex items-start">
                        <div className="ml-3">
                            {isSaved ? (
                                <span className="font-bold text-emerald-500">Settings saved successfully!</span>
                            ) : (
                                <span className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>Click save to apply changes</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 text-white font-bold rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95"
                        style={{
                            backgroundColor: 'var(--theme-primary)',
                            boxShadow: '0 4px 15px var(--theme-primary-glow)'
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
