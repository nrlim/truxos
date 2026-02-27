"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ShieldAlert,
    UserCircle,
    Building2,
    Truck,
    LogOut,
    Menu,
    X,
    UserCog
} from "lucide-react";
import { useNotification } from "@/components/ui/notification-provider";
import { useModal } from "@/components/ui/modal-provider";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import clsx from "clsx";

interface UserData {
    id: string;
    username: string;
    fullName: string;
    role: string;
    tenantId: string;
}

interface TenantData {
    id: string;
    name: string;
    slug: string;
}

const userSchema = z.object({
    fullName: z.string().min(2, "Nama Lengkap minimal 2 karakter"),
    username: z.string().min(4, "Username minimal 4 karakter"),
    password: z.string().optional(),
    role: z.enum(["OWNER", "ADMIN", "STAFF"]),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
    const router = useRouter();
    const notify = useNotification();
    const modal = useModal();
    const [currentUser, setCurrentUser] = useState<UserData | null>(null);
    const [tenant, setTenant] = useState<TenantData | null>(null);

    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mobile menu toggle (if needed)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: "STAFF",
        },
    });

    useEffect(() => {
        const init = () => {
            const token = localStorage.getItem("truxos_token");
            const userDataStr = localStorage.getItem("truxos_user");
            const tenantDataStr = localStorage.getItem("truxos_tenant");

            if (!token || !userDataStr || !tenantDataStr) {
                router.push("/login");
                return;
            }

            const userData = JSON.parse(userDataStr);
            const tenantData = JSON.parse(tenantDataStr);

            if (userData.role !== "OWNER" && userData.role !== "ADMIN") {
                notify.error("Anda tidak memiliki akses ke halaman ini");
                router.push("/dashboard");
                return;
            }

            setCurrentUser(userData);
            setTenant(tenantData);
            fetchUsers(tenantData.id);
        };

        init();
    }, [router]);

    const fetchUsers = async (tenantId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/users?tenantId=${tenantId}`);
            if (!response.ok) throw new Error("Gagal mengambil data pengguna");
            const data = await response.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error(error);
            notify.error("Gagal mengambil data pengguna");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("truxos_token");
        localStorage.removeItem("truxos_user");
        localStorage.removeItem("truxos_tenant");
        router.push("/login");
    };

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        return users.filter(
            (u) =>
                u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const openModalForAdd = () => {
        setEditingUser(null);
        reset({ fullName: "", username: "", password: "", role: "STAFF" });
        setIsModalOpen(true);
    };

    const openModalForEdit = (user: UserData) => {
        setEditingUser(user);
        reset({
            fullName: user.fullName,
            username: user.username,
            role: user.role as any,
            password: "", // Jangan isi password saat edit
        });
        setIsModalOpen(true);
    };

    const closeAndResetModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        reset();
    };

    const onSubmit = async (data: UserFormValues) => {
        if (!tenant) return;
        setIsSubmitting(true);

        try {
            if (editingUser) {
                // UPDATE
                const payload: any = { ...data, tenantId: tenant.id };
                if (!payload.password) delete payload.password; // Jangan kirim password kosong jika edit

                const res = await fetch(`/api/users/${editingUser.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Gagal memperbarui pengguna");
                }
                notify.success("Pengguna berhasil diperbarui");
            } else {
                // CREATE
                if (!data.password || data.password.length < 6) {
                    throw new Error("Password minimal 6 karakter untuk pengguna baru");
                }
                const res = await fetch(`/api/users`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...data, tenantId: tenant.id }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Gagal menambahkan pengguna");
                }
                notify.success("Pengguna berhasil ditambahkan");
            }

            closeAndResetModal();
            fetchUsers(tenant.id);
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (!tenant || !currentUser) return;
        if (id === currentUser.id) {
            notify.error("Anda tidak dapat menghapus akun Anda sendiri");
            return;
        }

        modal.confirm({
            title: "Konfirmasi Penghapusan Pengguna",
            message: `Pengguna '${name}' akan dihapus secara permanen dari organisasi. Tindakan ini tidak dapat dibatalkan.`,
            confirmLabel: "Hapus Pengguna",
            variant: "danger",
            onConfirm: async () => {
                const res = await fetch(`/api/users/${id}?tenantId=${tenant.id}`, {
                    method: "DELETE",
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Gagal menghapus pengguna");
                }
                notify.success("Pengguna berhasil dihapus");
                fetchUsers(tenant.id);
            },
        });
    };

    if (!currentUser || !tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const RoleBadge = ({ role }: { role: string }) => {
        let styles = "";
        let icon = null;
        switch (role) {
            case "OWNER":
                styles = "bg-amber-100 text-amber-800 border-amber-200";
                icon = <ShieldAlert className="w-3 h-3 mr-1" />;
                break;
            case "ADMIN":
                styles = "bg-blue-100 text-blue-800 border-blue-200";
                icon = <UserCog className="w-3 h-3 mr-1" />;
                break;
            default:
                styles = "bg-slate-100 text-slate-700 border-slate-200";
                icon = <UserCircle className="w-3 h-3 mr-1" />;
        }
        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles}`}>
                {icon}
                {role}
            </span>
        );
    };

    return (
        <main className="px-4 sm:px-8 max-w-7xl mx-auto py-6 sm:py-8 relative w-full font-sans text-slate-900 pb-20 sm:pb-8">
            {/* Header Action Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Manajemen Pengguna
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola akses anggota tim di organisasi <span className="font-semibold text-slate-700">{tenant.name}</span>.
                    </p>
                </div>

                {/* Desktop Add Button */}
                <button
                    onClick={openModalForAdd}
                    className="hidden sm:flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Pengguna
                </button>
            </div>

            {/* Sub-Header: Search/Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari pengguna berdasarkan nama atau username..."
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Users List - Card Layout (Mobile) / Table Grid Layout (Desktop) */}
            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white py-16 px-4 text-center rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <UserCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Tidak ada pengguna ditemukan</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {searchQuery ? "Ubah kata kunci pencarian Anda." : "Mulai dengan menambahkan pengguna baru."}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                            Bersihkan pencarian
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredUsers.map((u) => (
                        <div key={u.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
                            {/* Highlight strip for active user */}
                            {u.id === currentUser.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg">
                                        {u.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{u.fullName}</h3>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">@{u.username}</p>
                                    </div>
                                </div>

                                {/* Action Menus */}
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModalForEdit(u)}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                        title="Edit Pengguna"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {u.id !== currentUser.id && (
                                        <button
                                            onClick={() => handleDelete(u.id, u.fullName)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Hapus Pengguna"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Peran Akses</span>
                                    <div><RoleBadge role={u.role} /></div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Status</span>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        Aktif
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mobile FAB */}
            <button
                onClick={openModalForAdd}
                className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-40"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Modal / Slider (Add/Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={closeAndResetModal}
                    ></div>

                    {/* Modal Content */}
                    <div className="bg-white w-full h-full sm:h-auto sm:w-[500px] sm:max-h-[90vh] sm:rounded-l-2xl shadow-2xl relative flex flex-col transform transition-transform animate-in slide-in-from-right sm:mr-0 z-10 overscroll-contain">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingUser ? "Edit Pengguna" : "Pengguna Baru"}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    {editingUser ? "Perbarui informasi anggota tim." : "Tambahkan anggota tim ke organisasi."}
                                </p>
                            </div>
                            <button
                                onClick={closeAndResetModal}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable form) */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        {...register("fullName")}
                                        className={clsx(
                                            "w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors",
                                            errors.fullName ? "border-red-300 focus:ring-red-500" : "border-slate-200"
                                        )}
                                        placeholder="Misal: Budi Santoso"
                                    />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username (Login ID)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-400 text-sm font-mono">@</span>
                                        </div>
                                        <input
                                            type="text"
                                            {...register("username")}
                                            className={clsx(
                                                "w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lowercase transition-colors",
                                                errors.username ? "border-red-300 focus:ring-red-500" : "border-slate-200"
                                            )}
                                            placeholder="budisantoso"
                                        />
                                    </div>
                                    {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
                                    <p className="text-[11px] text-slate-400 mt-1">Username harus unik dan tidak mengandung spasi.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        {...register("password")}
                                        className={clsx(
                                            "w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors",
                                            errors.password ? "border-red-300" : "border-slate-200"
                                        )}
                                        placeholder={editingUser ? "•••••••• (Biarkan kosong jika tidak diubah)" : "••••••••"}
                                    />
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                    {!editingUser && <p className="text-[11px] text-slate-400 mt-1">Minimal 6 karakter.</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Peran Sistem (Role)</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {/* Role Options as Radios/Cards for better touch targets */}
                                        <label className={clsx(
                                            "relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none",
                                            "has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50",
                                            "border-slate-200 bg-white hover:bg-slate-50"
                                        )}>
                                            <input type="radio" value="STAFF" {...register("role")} className="sr-only" />
                                            <span className="flex flex-1">
                                                <span className="flex flex-col">
                                                    <span className="block text-sm font-medium text-slate-900">Staff / Operator</span>
                                                    <span className="mt-1 flex items-center text-xs text-slate-500">Akses standar untuk update operasi.</span>
                                                </span>
                                            </span>
                                            <UserCircle className="h-5 w-5 text-slate-400 has-[:checked]:text-blue-600" aria-hidden="true" />
                                        </label>

                                        <label className={clsx(
                                            "relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none",
                                            "has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50",
                                            "border-slate-200 bg-white hover:bg-slate-50"
                                        )}>
                                            <input type="radio" value="ADMIN" {...register("role")} className="sr-only" />
                                            <span className="flex flex-1">
                                                <span className="flex flex-col">
                                                    <span className="block text-sm font-medium text-slate-900">Administrator</span>
                                                    <span className="mt-1 flex items-center text-xs text-slate-500">Akses penuh ke modul, kecuali penagihan.</span>
                                                </span>
                                            </span>
                                            <UserCog className="h-5 w-5 text-slate-400 has-[:checked]:text-blue-600" aria-hidden="true" />
                                        </label>

                                        <label className={clsx(
                                            "relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none",
                                            "has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50",
                                            "border-slate-200 bg-white hover:bg-slate-50"
                                        )}>
                                            <input type="radio" value="OWNER" {...register("role")} className="sr-only" />
                                            <span className="flex flex-1">
                                                <span className="flex flex-col">
                                                    <span className="block text-sm font-medium text-slate-900">Owner (Pemilik)</span>
                                                    <span className="mt-1 flex items-center text-xs text-slate-500">Kontrol absolut atas organisasi.</span>
                                                </span>
                                            </span>
                                            <ShieldAlert className="h-5 w-5 text-slate-400 has-[:checked]:text-amber-600" aria-hidden="true" />
                                        </label>
                                    </div>
                                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                                </div>

                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t border-slate-100 bg-slate-50 sm:rounded-bl-2xl flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeAndResetModal}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                form="user-form"
                                disabled={isSubmitting}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                {editingUser ? "Simpan Perubahan" : "Tambahkan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
