export default function AdminPage() {
    return (
        <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16 text-slate-900">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">
                    Admin placeholder
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                    Admin felület – hamarosan jön a hitelesítés és a CRUD.
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-600">
                    Jelenleg csak a scaffold és a moduláris szerkezeti gondolkodás látszik. A későbbi
                    admin hitelesítés jelszó + e-mailes kétfaktoros kód lesz.
                </p>
            </div>
        </main>
    );
}
