import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import SOSAlert from './SOSAlert';
import AIChatWidget from './AIChatWidget';

const Layout = () => {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <SOSAlert />
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

