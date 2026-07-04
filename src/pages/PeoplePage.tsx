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
import type { Person } from '../types';

const schema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  archived: z.boolean(),
});

type PersonForm = z.infer<typeof schema>;

const defaults: PersonForm = { name: '', email: '', phone: '', notes: '', archived: false };

export function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<PersonForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  async function loadPeople() {
    setError(null);
    const { data, error: loadError } = await supabase
      .from('people')
      .select('*')
      .order('created_at', { ascending: false });
    if (loadError) setError(loadError.message);
    else setPeople((data ?? []) as Person[]);
  }

  useEffect(() => {
    void loadPeople();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return people.filter((person) => {
      const matchesArchive = showArchived || !person.archived;
      const matchesSearch = [person.name, person.email, person.phone, person.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
      return matchesArchive && matchesSearch;
    });
  }, [people, search, showArchived]);

  function startCreate() {
    setEditing(null);
    reset(defaults);
    setOpen(true);
  }

  function startEdit(person: Person) {
    setEditing(person);
    reset({
      name: person.name,
      email: person.email ?? '',
      phone: person.phone ?? '',
      notes: person.notes ?? '',
      archived: person.archived,
    });
    setOpen(true);
  }

  async function archivePerson(person: Person, archived: boolean) {
    const { error: archiveError } = await supabase.from('people').update({ archived }).eq('id', person.id);
    if (archiveError) setError(archiveError.message);
    else {
      setSuccess(archived ? 'Person archived.' : 'Person restored.');
      await loadPeople();
    }
  }

  async function onSubmit(values: PersonForm) {
    setError(null);
    const payload = {
      name: values.name.trim(),
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      notes: values.notes?.trim() || null,
      archived: values.archived,
    };

    const result = editing
      ? await supabase.from('people').update(payload).eq('id', editing.id)
      : await supabase.from('people').insert(payload);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setSuccess(editing ? 'Person updated.' : 'Person added.');
    setOpen(false);
    await loadPeople();
  }

  return (
    <Box>
      <PageHeader title="People" subtitle="Partners, stakeholders, vendors, and internal owners." actionLabel="Add Person" onAction={startCreate} />
      <StatusBanner error={error} success={success} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <SearchField value={search} onChange={setSearch} label="Search people" />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={<Checkbox checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />}
            label="Show archived"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {filtered.map((person) => (
          <Grid item xs={12} md={6} lg={4} key={person.id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                  <Box>
                    <Typography variant="h6">{person.name}</Typography>
                    <Typography color="text.secondary" variant="body2">{person.email || 'No email'}</Typography>
                    <Typography color="text.secondary" variant="body2">{person.phone || 'No phone'}</Typography>
                  </Box>
                  <Stack direction="row">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => startEdit(person)} aria-label={`Edit ${person.name}`}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={person.archived ? 'Restore' : 'Archive'}>
                      <IconButton onClick={() => archivePerson(person, !person.archived)} aria-label={person.archived ? 'Restore person' : 'Archive person'}>
                        {person.archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                {person.notes ? <Typography sx={{ mt: 1.5 }}>{person.notes}</Typography> : null}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filtered.length === 0 ? <Typography color="text.secondary" sx={{ mt: 4 }}>No people match the current view.</Typography> : null}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Person' : 'Add Person'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Controller name="name" control={control} render={({ field, fieldState }) => <TextField {...field} label="Name" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} autoFocus />} />
            <Controller name="email" control={control} render={({ field, fieldState }) => <TextField {...field} label="Email" error={Boolean(fieldState.error)} helperText={fieldState.error?.message} />} />
            <Controller name="phone" control={control} render={({ field }) => <TextField {...field} label="Phone" />} />
            <Controller name="notes" control={control} render={({ field }) => <TextField {...field} label="Notes" multiline minRows={3} />} />
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
