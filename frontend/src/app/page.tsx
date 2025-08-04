'use client';

import { Button, Typography, Box, Paper } from '@mui/material';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const idToken = await user.getIdToken();

      console.log('ログイン成功！');
      console.log('ユーザー情報:', user);
      console.log('IDトークン:', idToken);

      // TODO: ここでバックエンドにIDトークンを送信する処理を後で追加
    } catch (error) {
      console.error('ログインエラー', error);
    }
  };

  return (
    <Box p={4}>
      <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          ようこそ！
        </Typography>
        <Typography sx={{ mb: 2 }}>続けるにはログインしてください。</Typography>
        <Button variant="contained" onClick={handleGoogleLogin}>
          Googleでログイン
        </Button>
      </Paper>
    </Box>
  );
}
