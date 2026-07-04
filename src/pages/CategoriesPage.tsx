import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import EditIcon from '@mui/icons-material/Edit';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '../components/PageHeader';
import { SearchField } from '../components/SearchField';
import { StatusBanner } from '../components/StatusBanner';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  description: z.string().trim().optional(),
  archived: z.boolean(),
});

type CategoryForm = z.infer<typeof schema>;

const defaults: CategoryForm = { name: '', description: '', archived: false };

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<CategoryForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  async function loadCategories() {
    setError(null);
    const { data, error: loadError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    else setCategories((data ?? []) as Category[]);
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return categories.filter((category) => {
      const matchesArchive = showArchived || !category.archived;
      const matchesSearch = [category.name, category.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
      return matchesArchive && matchesSearch;
    });
  }, [categories, search, showArchived]);

  function startCreate() {
    setEditing(null);
    reset(defaults);
    setOpen(true);
  }

  function startEdit(category: Category) {
    setEditing(category);
    reset({
      name: category.name,
      description: category.description ?? '',
      archived: category.archived,
    });
    setOpen(true);
  }

  async function archiveCategory(category: Category, archived: boolean) {
    const { error: archiveError } = await supabase.from('categories').update({ archived }).eq('id', category.id);
    if (archiveError) setError(archiveError.message);
    else {
      setSuccess(archived ? 'Category archived.' : 'Category restored.');
      await loadCategories();
    }
  }

  async function onSubmit(values: CategoryForm) {
    setError(null);
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      archived: values.archived,
    };

    const result = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccess(editing ? 'Category updated.' : 'Category added.');
    setOpen(false);
    await loadCategories();
  }

  return (
    <Box>
      <PageHeader title="Categories" subtitle="Create shared buckets for classifying transactions." actionLabel="Add Category" onAction={startCreate} />
      <StatusBanner error={error} success={success} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <SearchField value={search} onChange={setSearch} label="Search categories" />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={<Checkbox checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />}
            label="Show archived"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {filtered.map((category) => (
          <Grid item xs={12} md={6} lg={4} key={category.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box>
                    <Typography variant="h6">{category.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {category.archived ? 'Archived' : 'Active'}
                    </Typography>
                  </Box>
                  <Stack direction="row">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => startEdit(category)} aria-label={`Edit ${category.name}`}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={category.archived ? 'Restore' : 'Archive'}>
                      <IconButton onClick={() => archiveCategory(category, !category.archived)} aria-label={category.archived ? 'Restore category' : 'Archive category'}>
                        {category.archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                {category.description ? <Typography sx={{ mt: 1.5 }}>{category.description}</Typography> : null}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 ? <Typography color="text.secondary" sx={{ mt: 4 }}>No categories match the current view.</Typography> : null}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller name="name" control={control} render={({ field, fieldState }) => <TextField {...field} label="Name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} autoFocus />} />
            <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Description" multiline minRows={3} />} />
            <Controller name="archived" control={control} render={({ field }) => <FormControlLabel control={<Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} />} label="Archived" />} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={formState.isSubmitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
