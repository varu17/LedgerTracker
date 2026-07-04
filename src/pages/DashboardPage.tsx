import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TimelineIcon from '@mui/icons-material/Timeline';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StatusBanner } from '../components/StatusBanner';
import { formatAmount, formatDate } from '../lib/format';
import { supabase } from '../lib/supabase';
import type { NavKey, Transaction, TransactionEffect, TransactionType } from '../types';

type DashboardPageProps = {
  onNavigate: (page: NavKey) => void;
};

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const [transactionResult, typeResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, people(id, name), categories(id, name)')
          .is('deleted_at', null)
          .order('transaction_date', { ascending: false }),
        supabase.from('transaction_types').select('*').order('name', { ascending: true }),
      ]);

      const firstError = transactionResult.error ?? typeResult.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setTransactions((transactionResult.data ?? []) as Transaction[]);
        setTransactionTypes((typeResult.data ?? []) as TransactionType[]);
      }
      setLoading(false);
    }

    void load();
  }, []);

  const totals = useMemo(() => {
    const effectByName = transactionTypes.reduce<Record<string, TransactionEffect>>((acc, type) => {
      acc[type.name] = type.dashboard_effect;
      return acc;
    }, {});

    return transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount);
        const effect = effectByName[transaction.type] ?? transaction.type;
        if (effect === 'Spent') acc.spent += amount;
        if (effect === 'Received') acc.received += amount;
        if (effect === 'Capital Added') acc.capital += amount;
        return acc;
      },
      { spent: 0, received: 0, capital: 0 },
    );
  }, [transactionTypes, transactions]);

  const personMetrics = useMemo(() => {
    const effectByName = transactionTypes.reduce<Record<string, TransactionEffect>>((acc, type) => {
      acc[type.name] = type.dashboard_effect;
      return acc;
    }, {});

    const metrics = transactions.reduce<
      Record<string, { person: string; spent: number; received: number; capital: number; count: number }>
    >((acc, transaction) => {
      const person = transaction.people?.name ?? 'Unassigned';
      const amount = Number(transaction.amount);
      const effect = effectByName[transaction.type] ?? transaction.type;

      if (!acc[person]) {
        acc[person] = { person, spent: 0, received: 0, capital: 0, count: 0 };
      }

      if (effect === 'Spent') acc[person].spent += amount;
      if (effect === 'Received') acc[person].received += amount;
      if (effect === 'Capital Added') acc[person].capital += amount;
      acc[person].count += 1;

      return acc;
    }, {});

    return Object.values(metrics)
      .map((metric) => ({
        ...metric,
        net: metric.received + metric.capital - metric.spent,
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }, [transactionTypes, transactions]);

  const recentTransactions = transactions.slice(0, 8);

  const cards = [
    { label: 'Total Spent', value: totals.spent, icon: <PaymentsIcon />, color: '#b42318' },
    { label: 'Total Received', value: totals.received, icon: <CallReceivedIcon />, color: '#257a4d' },
    { label: 'Total Capital Added', value: totals.capital, icon: <AccountBalanceIcon />, color: '#6d4c9d' },
    {
      label: 'Net Position',
      value: totals.received + totals.capital - totals.spent,
      icon: <TimelineIcon />,
      color: '#1f6f5b',
    },
    {
      label: 'Transaction Count',
      value: transactions.length,
      icon: <ReceiptLongIcon />,
      color: '#334155',
      numeric: true,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Shared transaction health across partners and stakeholders."
        actionLabel="New Transaction"
        onAction={() => onNavigate('transactions')}
      />
      <StatusBanner error={error} />

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {cards.map((card) => (
              <Grid item xs={12} sm={6} lg={card.label === 'Transaction Count' ? 4 : 3} key={card.label}>
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" gap={2}>
                      <Box>
                        <Typography color="text.secondary" variant="body2">
                          {card.label}
                        </Typography>
                        <Typography variant="h5" sx={{ mt: 1, color: card.color }}>
                          {card.numeric ? card.value : formatAmount(card.value)}
                        </Typography>
                      </Box>
                      <Box sx={{ color: card.color }}>{card.icon}</Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Person-wise Metrics
          </Typography>
          <Grid container spacing={2}>
            {personMetrics.length === 0 ? (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">No person-wise metrics yet.</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ) : (
              personMetrics.map((metric) => (
                <Grid item xs={12} md={6} xl={4} key={metric.person}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                        <Box>
                          <Typography variant="h6">{metric.person}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {metric.count} transaction{metric.count === 1 ? '' : 's'}
                          </Typography>
                        </Box>
                        <Chip
                          label={`Net ${formatAmount(metric.net)}`}
                          color={metric.net >= 0 ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </Stack>
                      <Grid container spacing={1.5} sx={{ mt: 1 }}>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Spent
                          </Typography>
                          <Typography fontWeight={800}>{formatAmount(metric.spent)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Received
                          </Typography>
                          <Typography fontWeight={800}>{formatAmount(metric.received)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="text.secondary">
                            Capital
                          </Typography>
                          <Typography fontWeight={800}>{formatAmount(metric.capital)}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Recent Transactions
          </Typography>
          <Stack spacing={1.5}>
            {recentTransactions.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography color="text.secondary">No transactions yet.</Typography>
                </CardContent>
              </Card>
            ) : (
              recentTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5}>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography fontWeight={700}>{transaction.reason}</Typography>
                          <Chip size="small" label={transaction.type} />
                          {transaction.important ? <Chip size="small" color="warning" label="Important" /> : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Made {formatDate(transaction.transaction_date)} | Recorded {formatDate(transaction.created_at.slice(0, 10))} | {transaction.people?.name ?? 'No person'} |{' '}
                          {transaction.categories?.name ?? 'No category'}
                        </Typography>
                      </Box>
                      <Typography fontWeight={800}>{formatAmount(transaction.amount)}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </>
      )}
    </Box>
  );
}
