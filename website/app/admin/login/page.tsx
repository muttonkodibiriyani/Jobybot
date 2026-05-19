export const metadata = { title: "Admin sign-in · Jobybot" };

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="mx-auto max-w-md section-pad">
      <h1 className="h1">Admin sign-in</h1>
      <p className="lead mt-2">Use the ADMIN_PASSWORD from your .env.local</p>
      <form
        action="/api/admin/login"
        method="post"
        className="card mt-8 space-y-4"
      >
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            name="password"
            type="password"
            required
            autoFocus
            className="mt-2 block w-full rounded-lg border border-surface-border bg-white px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <AdminError searchParams={searchParams} />
        <button className="btn-primary w-full" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}

async function AdminError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (!error) return null;
  const msg = error === "ratelimit"
    ? "Too many attempts. Wait 10 minutes — owner has been alerted."
    : "Wrong password.";
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {msg}
    </div>
  );
}
