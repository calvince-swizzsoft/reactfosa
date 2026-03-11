export const Collapsible = ({ title, children, isOpen, toggle }) => (
    <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center cursor-pointer" onClick={toggle}>
            <h3 className="font-semibold">{title}</h3>
            <span>{isOpen ? "▲" : "▼"}</span>
        </div>
        {isOpen && <div className="mt-2 grid grid-cols-2 gap-2 text-sm">{children}</div>}
    </div>
);

export const KV = ({ k, v }) => (
    <>
        <div className="text-slate-500">{k}</div>
        <div className="font-medium">{v ?? "—"}</div>
    </>
);
