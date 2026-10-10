import Link from "next/link";
export function Mark({ size = 26 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="8" fill="#0E1A2E" stroke="#1B2A45" />
    <path d="M7 23V10l4.5 8L16 10v13M20 23V10l5 13V10" stroke="#3EE0C1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>;
}
export function Nav({ authed = false }: { authed?: boolean }) {
  return <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
    <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight"><Mark />meeru</Link>
    <nav className="flex items-center gap-1 text-sm text-mist sm:gap-5">
      <Link href="/#pricing" className="hidden px-2 hover:text-paper sm:block">Pricing</Link>
      <Link href="/docs" className="px-2 hover:text-paper">Docs</Link>
      <Link href={authed ? "/dashboard" : "/login"} className="btn btn-primary ml-1">{authed ? "Dashboard" : "Get your API key"}</Link>
    </nav></header>;
}
