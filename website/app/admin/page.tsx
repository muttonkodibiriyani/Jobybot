import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listOrders } from "@/lib/orders";
import { AdminTable } from "@/components/AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("jb_admin")?.value;
  if (!session || session !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login");
  }

  const pending = await listOrders("pending");
  const approved = await listOrders("approved");

  return (
    <div className="mx-auto max-w-page section-pad">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="h1 mt-2">Order verification</h1>
          <p className="lead mt-2">
            {pending.length} pending · {approved.length} approved · refreshes every 60 s
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="btn-secondary !py-2 !text-sm" type="submit">Sign out</button>
        </form>
      </div>

      <section className="card mt-10">
        <h2 className="text-xl font-bold">Pending verification</h2>
        <p className="text-sm text-ink-muted">
          Open Gmail to view the screenshot, confirm the UPI app shows the transaction,
          then approve to send the download link automatically.
        </p>
        <AdminTable orders={pending} />
      </section>

      <section className="card mt-10">
        <h2 className="text-xl font-bold">Recently approved</h2>
        <AdminTable orders={approved.slice(0, 30)} approvedView />
      </section>
    </div>
  );
}
