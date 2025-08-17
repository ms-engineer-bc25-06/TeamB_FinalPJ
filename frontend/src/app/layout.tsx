'use client';

import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      {/* <LocalizationProvider dateAdapter={AdapterDayjs}> */}
      {children}
      {/* </LocalizationProvider> */}
    </AuthProvider>
  );
}
