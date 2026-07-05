import { Source_Sans_3 } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Ministry IT Support Portal',
  description: 'Ministry of Basic Education — IT Support Portal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={sourceSans.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
