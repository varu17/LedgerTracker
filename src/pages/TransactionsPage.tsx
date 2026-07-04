import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestoreIcon from '@mui/icons-material/Restore';
import StarIcon from '@mui/icons-material/Star';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { StatusBanner } from '../components/StatusBanner';
import { formatAmount, formatDate } from '../lib/format';
import { defaultTransactionTypes, paymentModes } from '../lib/options';
import { supabase } from '../lib/supabase';
import type { Category, PaymentMode, Person, Transaction, TransactionEffect, TransactionType } from '../types';

const schema = z.object({
  transaction_date: z.string().min(1, 'Date is required'),
  person_id: z.string().optional(),
  category_id: z.string().optional(),
  type: z.string().trim().min(1, 'Transaction type is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  reason: z.string().trim().min(2, 'Reason is required'),
  description: z.string().trim().optional(),
  payment_mode: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque', 'Other']),
  important: z.boolean(),
});

type TransactionForm = z.infer<typeof schema>;

const today = new Date().toISOString().slice(0, 10);

const defaults: TransactionForm = {
  transaction_date: today,
  person_id: '',
  category_id: '',
  type: 'Spent',
  amount: 0,
  reason: '',
  description: '',
  payment_mode: 'Other',
  important: false,
};

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showDeleted, setShowDeleted] = useState(false);
  const [importantOnly, setImportantOnly] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeEffect, setNewTypeEffect] = useState<TransactionEffect>('Neutral');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue, formState } = useForm<TransactionForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  async function loadAll() {
    setError(null);
    const [transactionResult, peopleResult, categoryResult, typeResult] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, people(id, name), categories(id, name)')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('people').select('*').order('name', { ascending: true }),
      supabase.from('categories').select('*').order('name', { ascending: true }),
      supabase.from('transaction_types').select('*').order('name', { ascending: true }),
    ]);

    const firstError = transactionResult.error ?? peopleResult.error ?? categoryResult.error ?? typeResult.error;
    if (firstError) {
      setError(firstError.message);
      return;
    }

    setTransactions((transactionResult.data ?? []) as Transaction[]);
    setPeople((peopleResult.data ?? []) as Person[]);
    setCategories((categoryResult.data ?? []) as Category[]);
    setTransactionTypes((typeResult.data ?? []) as TransactionType[]);
  }

  useEffect(() => {
    void loadAll();
  }, []);

  const activePeople = people.filter((person) => !person.archived);
  const activeCategories = categories.filter((category) => !category.archived);
  const activeTransactionTypes = transactionTypes.filter((type) => !type.archived);
  const typeOptions = activeTransactionTypes.length > 0
    ? activeTransactionTypes.map((type) => type.name)
    : defaultTransactionTypes;

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return transactions.filter((transaction) => {
      const matchesDeleted = showDeleted || !transaction.deleted_at;
      const matchesType = typeFilter === 'All' || transaction.type === typeFilter;
      const matchesImportant = !importantOnly || transaction.important;
      const matchesSearch = [
        transaction.reason,
        transaction.description,
        transaction.payment_mode,
        transaction.type,
        transaction.people?.name,
        transaction.categories?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
      return matchesDeleted && matchesType && matchesImportant && matchesSearch;
    });
  }, [importantOnly, search, showDeleted, transactions, typeFilter]);

  function startCreate() {
    setEditing(null);
    reset(defaults);
    setOpen(true);
  }

  function startEdit(transaction: Transaction) {
    setEditing(transaction);
    reset({
      transaction_date: transaction.transaction_date,
      person_id: transaction.person_id ?? '',
      category_id: transaction.category_id ?? '',
      type: transaction.type,
      amount: Number(transaction.amount),
      reason: transaction.reason,
      description: transaction.description ?? '',
      payment_mode: transaction.payment_mode,
      important: transaction.important,
    });
    setOpen(true);
  }

  async function softDelete(transaction: Transaction) {
    const { error: deleteError } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', transaction.id);
    if (deleteError) setError(deleteError.message);
    else {
      setSuccess('Transaction deleted.');
      await loadAll();
    }
  }

  async function restore(transaction: Transaction) {
    const { error: restoreError } = await supabase
      .from('transactions')
      .update({ deleted_at: null })
      .eq('id', transaction.id);
    if (restoreError) setError(restoreError.message);
    else {
      setSuccess('Transaction restored.');
      await loadAll();
    }
  }

  async function createTransactionType() {
    const name = newTypeName.trim();
    if (!name) {
      setError('Transaction type name is required.');
      return;
    }

    const { error: typeError } = await supabase
      .from('transaction_types')
      .insert({ name, dashboard_effect: newTypeEffect });

    if (typeError) {
      setError(typeError.message);
      return;
    }

    setSuccess('Transaction type created.');
    setNewTypeName('');
    setNewTypeEffect('Neutral');
    setTypeDialogOpen(false);
    await loadAll();
    setValue('type', name, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(values: TransactionForm) {
    setError(null);
    const payload = {
      transaction_date: values.transaction_date,
      person_id: values.person_id || null,
      category_id: values.category_id || null,
      type: values.type,
      amount: values.amount,
      reason: values.reason.trim(),
      description: values.description?.trim() || null,
      payment_mode: values.payment_mode,
      important: values.important,
    };

    const result = editing
      ? await supabase.from('transactions').update(payload).eq('id', editing.id)
      : await supabase.from('transactions').insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccess(editing ? 'Transaction updated.' : 'Transaction created.');
    setOpen(false);
    await loadAll();
  }

  return (
    <Box>
      <PageHeader title="Transactions" subtitle="Create, edit, soft delete, and restore shared ledger entries." actionLabel="New Transaction" onAction={startCreate} />
      <StatusBanner error={error} success={success} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <SearchField value={search} onChange={setSearch} label="Search transactions" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <MenuItem value="All">All Types</MenuItem>
              {typeOptions.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
            <FormControlLabel control={<Checkbox checked={importantOnly} onChange={(event) => setImportantOnly(event.target.checked)} />} label="Important" />
            <FormControlLabel control={<Checkbox checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} />} label="Show deleted" />
          </Stack>
        </Grid>
      </Grid>

      <Stack spacing={1.5}>
        {filtered.map((transaction) => (
          <Card key={transaction.id} sx={{ opacity: transaction.deleted_at ? 0.72 : 1 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6">{transaction.reason}</Typography>
                    <Chip size="small" label={transaction.type} />
                    <Chip size="small" label={transaction.payment_mode} variant="outlined" />
                    {transaction.important ? <StarIcon color="warning" fontSize="small" /> : null}
                    {transaction.deleted_at ? <Chip size="small" color="error" label="Deleted" /> : null}
                  </Stack>
                  <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                    Made {formatDate(transaction.transaction_date)} | Recorded {formatDate(transaction.created_at.slice(0, 10))} | {transaction.people?.name ?? 'No person'} | {transaction.categories?.name ?? 'No category'}
                  </Typography>
                  {transaction.description ? <Typography sx={{ mt: 1 }}>{transaction.description}</Typography> : null}
                </Box>
                <Stack direction="row" alignItems="center" justifyContent={{ xs: 'space-between', md: 'flex-end' }} gap={1}>
                  <Typography variant="h6">{formatAmount(transaction.amount)}</Typography>
                  <Tooltip title="Edit">
                    <span>
                      <IconButton onClick={() => startEdit(transaction)} disabled={Boolean(transaction.deleted_at)} aria-label="Edit transaction">
                        <EditIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {transaction.deleted_at ? (
                    <Tooltip title="Restore">
                      <IconButton onClick={() => restore(transaction)} aria-label="Restore transaction">
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Delete">
                      <IconButton onClick={() => softDelete(transaction)} aria-label="Delete transaction">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {filtered.length === 0 ? <Typography color="text.secondary" sx={{ mt: 4 }}>No transactions match the current filters.</Typography> : null}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit Transaction' : 'Create Transaction'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Controller name="transaction_date" control={control} render={({ field, fieldState }) => <TextField {...field} type="date" label="Transaction Made Date" fullWidth InputLabelProps={{ shrink: true }} error={Boolean(fieldState.error)} helperText={fieldState.error?.message ?? 'This can be today or a past date.'} />} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" gap={1} alignItems="flex-start">
                <Controller name="type" control={control} render={({ field, fieldState }) => <TextField {...field} select label="Transaction Type" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message}>{typeOptions.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField>} />
                <Tooltip title="Add transaction type">
                  <IconButton onClick={() => setTypeDialogOpen(true)} aria-label="Add transaction type" sx={{ mt: 1 }}>
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="person_id" control={control} render={({ field }) => <TextField {...field} select label="Person" fullWidth><MenuItem value="">None</MenuItem>{activePeople.map((person) => <MenuItem key={person.id} value={person.id}>{person.name}</MenuItem>)}</TextField>} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="category_id" control={control} render={({ field }) => <TextField {...field} select label="Category" fullWidth><MenuItem value="">None</MenuItem>{activeCategories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</TextField>} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="amount" control={control} render={({ field, fieldState }) => <TextField {...field} type="number" label="Amount" fullWidth inputProps={{ min: 0, step: '0.01' }} error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="payment_mode" control={control} render={({ field }) => <TextField {...field} select label="Payment Mode" fullWidth>{paymentModes.map((mode: PaymentMode) => <MenuItem key={mode} value={mode}>{mode}</MenuItem>)}</TextField>} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="reason" control={control} render={({ field, fieldState }) => <TextField {...field} label="Reason" fullWidth error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Description" fullWidth multiline minRows={3} />} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="important" control={control} render={({ field }) => <FormControlLabel control={<Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />} label="Important" />} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={formState.isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={typeDialogOpen} onClose={() => setTypeDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Transaction Type</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Type Name"
              value={newTypeName}
              onChange={(event) => setNewTypeName(event.target.value)}
              autoFocus
              fullWidth
            />
            <TextField
              select
              label="Dashboard Effect"
              value={newTypeEffect}
              onChange={(event) => setNewTypeEffect(event.target.value as TransactionEffect)}
              fullWidth
              helperText="This controls dashboard totals and net position."
            >
              <MenuItem value="Spent">Counts as spent</MenuItem>
              <MenuItem value="Received">Counts as received</MenuItem>
              <MenuItem value="Capital Added">Counts as capital added</MenuItem>
              <MenuItem value="Neutral">No dashboard total effect</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createTransactionType}>
            Save Type
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
