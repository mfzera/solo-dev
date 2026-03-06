import Header from "@/components/Header";
import { getProfile } from "@/lib/auth-actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getProfile();

  return (
    <>
      <Header user={user} />
      <main style={{ padding: "16px", maxWidth: 1400, margin: "0 auto" }}>
        {children}
      </main>
    </>
  );
}
