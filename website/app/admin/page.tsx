import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listOrders, listRefunds, recentSecurityEvents } from "@/lib/orders";
import { AdminTable } from "@/components/AdminTable";
import { RefundsTable } from "@/components/RefundsTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("jb_admin")?.value;
  if (!session || session !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login");
  }

  const [pending, approved, refundsPending, refundsDone, secEvents] = await Promise.all([
    listOrders("pending"),
    listOrders("approved"),
    listRefunds("pending"),
    listRefunds("refunded"),
    recentSecurityEvents(50),
  ]);

  return (
    <div className="mx-auto max-w-page section-pad px-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="h1 mt-2">Operations dashboard</h1>
          <p className="lead mt-2">
            {pending.length} order(s) to verify · {refundsPending.length} refund(s)
            to process · {secEvents.length} recent security events
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="btn-secondary !py-2 !text-sm" type="submit">Sign out</button>
        </form>
      </div>

      <section className="card mt-10">
        <h2 className="text-xl font-bold">Pending order verification</h2>
        <p className="text-sm text-ink-muted">
          Open the Gmail thread for the screenshot, confirm your PhonePe shows
          the transaction, then approve to email the download link automatically.
        </p>
        <AdminTable orders={pending} />
      </section>

      <section className="card mt-10 border-red-200">
        <h2 className="text-xl font-bold text-red-700">Pending refund requests</h2>
        <p className="text-sm text-ink-muted">
          7-day window enforced server-side. Approving sends the refunded email
          and marks the order &quot;refunded&quot;.
        </p>
        <RefundsTable refunds={refundsPending} />
      </section>

      <section className="card mt-10">
        <h2 className="text-xl font-bold">Recently approved orders</h2>
        <AdminTable orders={approved.slice(0, 30)} approvedView />
      </section>

      <section className="card mt-10">
        <h2 className="text-xl font-bold">Completed refunds</h2>
        <RefundsTable refunds={refundsDone.slice(0, 30)} approvedView />
      </section>

      <section className="card mt-10">
        <h2 className="text-xl font-bold">Security events (last 50)</h2>
        <p className="text-sm text-ink-muted">
          Failed logins, rate limits, suspicious requests. An email alert is sent
          when any event repeats 5× in 10 minutes from the same IP.
        </p>
        {secEvents.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No events yet — clean slate.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
                  <th className="py-2">When</th>
                  <th>Event</th>
                  <th>IP</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {secEvents.map((e, i) => (
                  <tr key={i} className="border-t border-surface-border">
                    <td className="py-2 font-mono text-xs">{e.at.slice(0, 19).replace("T", " ")}</td>
                    <td>
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold">
                        {e.event}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{e.ip}</td>
                    <td className="text-xs text-ink-muted">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
