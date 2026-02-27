import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';

const BulkUploadModal = ({ onClose, onUploadSuccess, title, sampleData, uploadEndpoint, expectedColumns }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResults(null);
        }
    };

    const handleDownloadSample = () => {
        const csv = Papa.unparse(sampleData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase()}_sample.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = () => {
        if (!file) {
            setError('Please select a CSV file first.');
            return;
        }

        setLoading(true);
        setError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (parsedOutput) => {
                const rows = parsedOutput.data;

                // Validate columns
                if (rows.length === 0) {
                    setError('The CSV file is empty.');
                    setLoading(false);
                    return;
                }

                const headers = Object.keys(rows[0]);
                const missingColumns = expectedColumns.filter(col => !headers.includes(col));
                if (missingColumns.length > 0) {
                    setError(`Missing required columns: ${missingColumns.join(', ')}`);
                    setLoading(false);
                    return;
                }

                try {
                    const response = await uploadEndpoint(rows);
                    setResults(response);
                    if (response.success > 0) {
                        onUploadSuccess(); // Refresh the list in the background
                    }
                } catch (err) {
                    setError(err.message || 'Failed to upload data.');
                } finally {
                    setLoading(false);
                }
            },
            error: (err) => {
                setError(`Error parsing CSV: ${err.message}`);
                setLoading(false);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

            <div
                className="relative w-full max-w-2xl rounded-[2rem] shadow-2xl border overflow-hidden animate-in zoom-in-95 duration-200 z-10"
                style={{
                    backgroundColor: 'var(--theme-bg-sidebar)',
                    borderColor: 'rgba(255,255,255,0.05)',
                    fontFamily: 'Inter, sans-serif'
                }}
            >
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: 'var(--theme-text-main)' }}>
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-white/5 opacity-50 hover:opacity-100" style={{ color: 'var(--theme-text-main)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {!results ? (
                        <>
                            <div className="mb-6 p-5 rounded-2xl border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                <h4 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>Instructions</h4>
                                <ul className="text-xs space-y-2 mb-4" style={{ color: 'var(--theme-text-muted)' }}>
                                    <li className="flex items-start gap-2"><span className="text-blue-500">•</span> Download the sample CSV file.</li>
                                    <li className="flex items-start gap-2"><span className="text-blue-500">•</span> Fill in your data without changing the column headers.</li>
                                    <li className="flex items-start gap-2"><span className="text-blue-500">•</span> <span className="font-bold" style={{ color: 'var(--theme-text-main)' }}>Compulsory:</span> DriverName, MobileNumber, Password, VehicleNumber, Category.</li>
                                    <li className="flex items-start gap-2"><span className="text-blue-500">•</span> Save as CSV and upload it here.</li>
                                </ul>
                                <button
                                    onClick={handleDownloadSample}
                                    className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl hover:bg-blue-500/10 transition-all flex items-center gap-2"
                                >
                                    <FileText size={14} />
                                    Download Sample CSV
                                </button>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl border flex items-start gap-3 bg-red-500/5 border-red-500/20 text-red-400 text-xs">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            )}

                            <div
                                className="group border-2 border-dashed rounded-[1.5rem] p-10 text-center transition-all cursor-pointer hover:bg-white/5"
                                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            >
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload size={24} style={{ color: 'var(--theme-text-muted)' }} />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight mb-1" style={{ color: 'var(--theme-text-main)' }}>
                                        {file ? file.name : 'Click to select CSV'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: 'var(--theme-text-muted)' }}>
                                        CSV format only
                                    </span>
                                </label>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5 border"
                                    style={{ color: 'var(--theme-text-muted)', borderColor: 'rgba(255,255,255,0.1)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || loading}
                                    className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 transition-all"
                                >
                                    {loading ? 'Processing...' : 'Upload Data'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight mb-2" style={{ color: 'var(--theme-text-main)' }}>Upload Complete</h3>
                            <div className="flex justify-center gap-4 text-xs font-bold uppercase tracking-widest mb-8">
                                <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20">
                                    {results.success} Inserted
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                    {results.failed} Failed
                                </span>
                            </div>

                            {results.errors && results.errors.length > 0 && (
                                <div className="mt-6 rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div className="px-4 py-3 border-b text-left flex items-center gap-2" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                                        <AlertCircle size={14} className="text-red-400" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-red-400">Error Details</h4>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto p-4 text-left space-y-2">
                                        {results.errors.map((err, idx) => (
                                            <div key={idx} className="text-[10px] font-medium leading-relaxed opacity-60 flex gap-2" style={{ color: 'var(--theme-text-main)' }}>
                                                <span className="text-red-500 shrink-0">[{idx + 1}]</span>
                                                {err}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-center">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-all shadow-xl"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkUploadModal;
