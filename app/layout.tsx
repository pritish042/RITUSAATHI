import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'RituSaathi — Your cycle diary', description: 'Track your cycle. Know what to ask. A private, browser-local menstrual health diary.' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
