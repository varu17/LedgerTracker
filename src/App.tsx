import { useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { CategoriesPage } from './pages/CategoriesPage';
import { DashboardPage } from './pages/DashboardPage';
import { PeoplePage } from './pages/PeoplePage';
import { TransactionsPage } from './pages/TransactionsPage';
import type { NavKey } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<NavKey>('dashboard');

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
      {activePage === 'people' && <PeoplePage />}
      {activePage === 'categories' && <CategoriesPage />}
      {activePage === 'transactions' && <TransactionsPage />}
    </AppLayout>
  );
}
