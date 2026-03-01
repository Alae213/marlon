export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          جاري تحميل لوحة التحكم...
        </h2>
        <p className="text-zinc-500">
          يرجى التأكد من إعداد Clerk بشكل صحيح
        </p>
      </div>
    </div>
  );
}
