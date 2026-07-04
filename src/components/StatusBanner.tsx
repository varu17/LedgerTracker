import { Alert, Collapse } from '@mui/material';

type StatusBannerProps = {
  error?: string | null;
  success?: string | null;
};

export function StatusBanner({ error, success }: StatusBannerProps) {
  return (
    <>
      <Collapse in={Boolean(error)} unmountOnExit>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Collapse>
      <Collapse in={Boolean(success)} unmountOnExit>
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      </Collapse>
    </>
  );
}
