import { TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

type SearchFieldProps = {
  value: string;
  label?: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, label = 'Search', onChange }: SearchFieldProps) {
  return (
    <TextField
      value={value}
      label={label}
      size="small"
      fullWidth
      onChange={(event) => onChange(event.target.value)}
      InputProps={{
        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
      }}
    />
  );
}
