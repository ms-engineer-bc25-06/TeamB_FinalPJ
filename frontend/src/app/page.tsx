'use client';

import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { ApiResponse } from '@/types/api';
import { CircularProgress, Typography, Alert, Box, Paper } from '@mui/material';

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const { data, error, isLoading } = useSWR<ApiResponse>(apiUrl, fetcher);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">
          データの取得に失敗しました😭: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          バックエンド連携テスト
        </Typography>
        <Alert severity={data?.db_status === 'ok' ? 'success' : 'warning'}>
          <Typography>
            <b>
              やったね！フロントエンドとバックエンドの連携テスト、成功です！🙌:
            </b>{' '}
            {data?.message}
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
}
