import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDevLoginEnabled } from "@/lib/devLogin";

export const metadata: Metadata = {
  title: "開發用登入",
};

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DevLoginPage({ searchParams }: Props) {
  if (!isDevLoginEnabled()) {
    notFound();
  }

  const { error } = await searchParams;

  const admin = createAdminClient();

  const [
    { data: adminProfiles },
    { data: teachers },
    { data: students },
    { data: loginProfiles },
  ] = await Promise.all([
    admin.from("profiles").select("id").eq("role", "admin"),

    admin
      .from("teachers")
      .select("id, name")
      .eq("active", true)
      .order("name"),

    admin
      .from("students")
      .select("id, name")
      .eq("active", true)
      .order("name"),

    admin
      .from("profiles")
      .select("teacher_id, student_id")
      .in("role", ["teacher", "student"]),
  ]);

  const admins = await Promise.all(
    (adminProfiles ?? []).map(async (profile) => {
      const { data } = await admin.auth.admin.getUserById(profile.id);

      return {
        id: profile.id as string,
        label: data.user?.email ?? profile.id,
      };
    }),
  );

  const teacherIdsWithLogin = new Set(
    (loginProfiles ?? []).map((profile) => profile.teacher_id),
  );

  const studentIdsWithLogin = new Set(
    (loginProfiles ?? []).map((profile) => profile.student_id),
  );

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">開發用登入</h1>

        <p className="mt-2 text-sm text-warning">
          只在 next dev + DEV_LOGIN=true 時可用。連的是 .env.local
          設定的 Supabase，還沒有登入身份的老師 / 學生會自動建立（不綁 LINE）。
        </p>

        {error && (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <Section title="Admin">
          {admins.map((item) => (
            <LoginLink
              key={item.id}
              href={`/auth/dev-login?role=admin&id=${item.id}`}
              label={item.label}
            />
          ))}
        </Section>

        <Section title="老師">
          {(teachers ?? []).map((teacher) => (
            <LoginLink
              key={teacher.id}
              href={`/auth/dev-login?role=teacher&id=${teacher.id}`}
              label={teacher.name}
              hint={
                teacherIdsWithLogin.has(teacher.id)
                  ? undefined
                  : "會建立登入身份"
              }
            />
          ))}
        </Section>

        <Section title="學生">
          {(students ?? []).map((student) => (
            <LoginLink
              key={student.id}
              href={`/auth/dev-login?role=student&id=${student.id}`}
              label={student.name}
              hint={
                studentIdsWithLogin.has(student.id)
                  ? undefined
                  : "會建立登入身份"
              }
            />
          ))}
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-medium text-muted">{title}</h2>

      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function LoginLink({
  href,
  label,
  hint,
}: {
  href: string;
  label: string;
  hint?: string;
}) {
  return (
    <a
      href={href}
      className="rounded-xl border border-line bg-surface px-4 py-2 text-sm hover:border-line-strong"
    >
      {label}
      {hint && <span className="ml-2 text-xs text-muted">{hint}</span>}
    </a>
  );
}
