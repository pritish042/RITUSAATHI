import type { Metadata } from 'next';
import '@fontsource/newsreader/latin-400.css';
import '@fontsource/newsreader/latin-500.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import './tokens.css';
import './globals.css';
import './stitch.css';
export const metadata: Metadata = { title: 'RituSaathi — Your cycle diary', description: 'Track your cycle. Know what to ask. A private, browser-local menstrual health diary.' };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
