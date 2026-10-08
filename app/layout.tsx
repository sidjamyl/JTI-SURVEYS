import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'JTI — Algeria Retail Pulse', description: 'Questionnaires terrain consommateurs et détaillants — français, arabe et anglais.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="fr" suppressHydrationWarning><body>{children}</body></html>;
}
