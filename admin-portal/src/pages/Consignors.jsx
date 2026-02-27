import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, Upload } from 'lucide-react';
import { consignorService } from '../services/api';
import AddConsignorModal from '../components/consignors/AddConsignorModal';
import BulkUploadModal from '../components/common/BulkUploadModal';
import { useAuth } from '../context/AuthContext';

const Consignors = () => {
    const { user } = useAuth();
    const [consignors, setConsignors] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [editingConsignor, setEditingConsignor] = useState(null);
    const [error, setError] = useState(null);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchConsignors = async () => {
        try {
            setLoading(true);
            const data = await consignorService.getAll({
                page,
                limit,
                search: debouncedSearch
            });

            if (data.consignors) {
                setConsignors(data.consignors);
                setTotal(data.total);
                setTotalPages(data.totalPages);
            } else {
                setConsignors(data);
                setTotal(data.length);
                setTotalPages(1);
            }
            setError(null);
        } catch (err) {
            setError('Failed to fetch consignors');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsignors();
    }, [page, debouncedSearch]);

    const handleAddClick = () => {
        setEditingConsignor(null);
        setIsAddModalOpen(true);
    };

    const handleEditClick = (consignor) => {
        setEditingConsignor(consignor);
        setIsAddModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Are you sure you want to delete this consignor?')) {
            try {
                await consignorService.delete(id);
                fetchConsignors();
            } catch (err) {
                console.error("Failed to delete consignor", err);
                alert('Failed to delete consignor');
            }
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black transition-colors duration-500" style={{ color: 'var(--theme-text-main)', fontFamily: 'Inter, sans-serif' }}>Consignors</h1>
                    <p className="text-xs uppercase tracking-widest font-bold opacity-50 mt-1 transition-colors duration-500" style={{ color: 'var(--theme-text-muted)' }}>
                        Total: <span style={{ color: 'var(--theme-primary)' }}>{total}</span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchConsignors()}
                        className="p-2 text-gray-400 hover:text-gray-200 rounded-full hover:bg-white/5 transition-colors"
                        title="Refresh List"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5"
                        style={{ color: 'var(--theme-text-main)', backgroundColor: 'transparent' }}
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Import CSV</span>
                    </button>
                    <button
                        onClick={handleAddClick}
                        className="px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-600/20 text-xs font-bold uppercase tracking-widest text-white"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Consignor</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div
                className="rounded-xl shadow border transition-colors duration-500"
                style={{
                    backgroundColor: 'var(--theme-bg-sidebar)',
                    borderColor: 'rgba(255,255,255,0.05)'
                }}
            >
                <div className="p-4">
                    <div className="relative max-w-md rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 opacity-50" style={{ color: 'var(--theme-text-main)' }} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search consignors..."
                            className="block w-full pl-10 pr-3 py-2.5 text-xs font-bold transition-all focus:outline-none"
                            style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--theme-text-main)' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center" style={{ color: 'var(--theme-text-muted)' }}>Loading consignors...</div>
                    ) : (
                        <table className="min-w-full divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                            <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Consignor Name</th>
                                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Mobile Number</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: 'var(--theme-text-muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                {consignors.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-10 text-center text-gray-500">
                                            No consignors found.
                                        </td>
                                    </tr>
                                ) : (
                                    consignors.map(consignor => (
                                        <tr key={consignor._id} style={{ borderColor: 'rgba(255,255,255,0.05)' }} className="transition-colors hover:bg-white/5">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-black tracking-tight" style={{ color: 'var(--theme-text-main)', fontFamily: 'Inter, sans-serif' }}>{consignor.name}</div>
                                                <div className="text-xs opacity-60 mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{consignor.contactPerson}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold" style={{ color: 'var(--theme-text-muted)' }}>{consignor.phone || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleEditClick(consignor)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(consignor._id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {total > 0 && (
                <div className="flex items-center justify-between border-t border-white/5 bg-transparent px-4 py-3 sm:px-6 mt-4 rounded-xl transition-all" style={{ backgroundColor: 'var(--theme-bg-sidebar)' }}>
                    <div className="hidden sm:flex flex-1 items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest font-bold opacity-50" style={{ color: 'var(--theme-text-muted)' }}>
                                Showing <span style={{ color: 'var(--theme-text-main)' }}>{(page - 1) * limit + 1}</span> to <span style={{ color: 'var(--theme-text-main)' }}>{Math.min(page * limit, total)}</span> of <span style={{ color: 'var(--theme-text-main)' }}>{total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'rgba(255,255,255,0.1)' }} aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-3 py-2 text-sm transition-all hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                                    style={{ color: 'var(--theme-text-main)' }}
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest border-x" style={{ color: 'var(--theme-text-main)', borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className="relative inline-flex items-center px-3 py-2 text-sm transition-all hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed"
                                    style={{ color: 'var(--theme-text-main)' }}
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <AddConsignorModal
                    onClose={() => setIsAddModalOpen(false)}
                    onConsignorAdded={fetchConsignors}
                    consignorToEdit={editingConsignor}
                />
            )}

            {isBulkModalOpen && (
                <BulkUploadModal
                    onClose={() => setIsBulkModalOpen(false)}
                    onUploadSuccess={fetchConsignors}
                    title="Bulk Import Consignors"
                    expectedColumns={['ConsignorName (Compulsory)', 'ContactPerson (Compulsory)', 'MobileNumber (Compulsory)', 'Email (Compulsory)', 'Address (Compulsory)', 'GSTIN (Compulsory)']}
                    sampleData={[
                        { 'ConsignorName (Compulsory)': 'ABC Logistics', 'ContactPerson (Compulsory)': 'John Doe', 'MobileNumber (Compulsory)': '9999999990', 'Email (Compulsory)': 'john@abc.com', 'Address (Compulsory)': '123 Main St, Bangalore', 'GSTIN (Compulsory)': '29ABCDE1234F1Z5' },
                        { 'ConsignorName (Compulsory)': 'XYZ Transport', 'ContactPerson (Compulsory)': 'Jane Smith', 'MobileNumber (Compulsory)': '8888888880', 'Email (Compulsory)': 'jane@xyz.com', 'Address (Compulsory)': '456 Cross Rd, Mumbai', 'GSTIN (Compulsory)': '27XYZDE9876F1Z5' }
                    ]}
                    uploadEndpoint={consignorService.bulkCreate}
                />
            )}
        </div>
    );
};

export default Consignors;
