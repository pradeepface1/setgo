import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIChatWidget from './AIChatWidget';

import useIdleTimeout from '../hooks/useIdleTimeout';

const Layout = () => {
    // Auto-logout after 3 minutes (180000 ms) of inactivity
    useIdleTimeout(180000);

    return (
        <div
            className="flex h-screen transition-colors duration-500"
            style={{ backgroundColor: 'var(--theme-bg-base)' }}
        >
            <AIChatWidget />
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;

