'use client';

import { useAuth } from '@/contexts/AuthContext';
import {
  Button,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from '@mui/material';

export default function Home() {
  const { user, login, logout, isLoading } = useAuth();

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

  return (
    <Box p={4}>
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        {user ? (
          // --- ログイン後の表示 ---
          <>
            <Typography variant="h4" gutterBottom>
              ようこそ、{user.nickname}さん！
            </Typography>
            <Typography sx={{ mb: 2 }}>ログインに成功しました。</Typography>
            <Button variant="outlined" onClick={logout}>
              ログアウト
            </Button>
          </>
        ) : (
          // --- ログアウト時の表示 ---
          <>
            <Typography variant="h4" gutterBottom>
              ようこそ！
            </Typography>
            <Typography sx={{ mb: 2 }}>
              続けるにはログインしてください。
            </Typography>
            <Button variant="contained" onClick={login}>
              Googleでログイン
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}
