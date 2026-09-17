"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Loader2,
    ArrowLeft,
    Pencil,
    Trash2,
    Truck,
    Phone,
    Mail,
    MapPin,
    Building2,
    CreditCard,
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type BankAccount = {
    bankName: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
};

type VendorBongkar = {
    id: string;
    code: string;
    name: string;
    contactPerson: string;
    email: string | null;
    phone: string;
    address: string;
    tipe: "SPSI" | "SPLO";
    bankAccounts: BankAccount[] | null;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt: string;
};

interface VendorBongkarDetailProps {
    id: string;
}

export function VendorBongkarDetail({ id }: VendorBongkarDetailProps) {
    const router = useRouter();
    const [data, setData] = useState<VendorBongkar | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/pt-pks/vendor-bongkar/${id}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else {
                    toast.error("Gagal memuat data vendor bongkar");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Terjadi kesalahan");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/pt-pks/vendor-bongkar/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Vendor bongkar berhasil dihapus");
                router.push("/dashboard/pt-pks/master/vendor-bongkar");
            } else {
                const error = await res.json();
                toast.error(error.error || "Gagal menghapus vendor bongkar");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan saat menghapus");
        } finally {
            setDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-16 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Vendor bongkar tidak ditemukan</p>
                <Button
                    variant="link"
                    onClick={() => router.push("/dashboard/pt-pks/master/vendor-bongkar")}
                >
                    Kembali ke daftar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
                    <p className="text-muted-foreground font-mono">{data.code}</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboard/pt-pks/master/vendor-bongkar/${id}/edit`)}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Informasi Umum */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Informasi Umum
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={data.status === "ACTIVE" ? "default" : "outline"}>
                                {data.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Tipe</span>
                            <Badge variant={data.tipe === "SPSI" ? "default" : "secondary"}>
                                {data.tipe}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Contact Person</p>
                                <p className="font-medium">{data.contactPerson}</p>
                                <p className="text-sm">{data.phone}</p>
                            </div>
                        </div>
                        {data.email && (
                            <>
                                <Separator />
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p>{data.email}</p>
                                    </div>
                                </div>
                            </>
                        )}
                        <Separator />
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm text-muted-foreground">Alamat</p>
                                <p>{data.address}</p>
                            </div>
                        </div>
                        <Separator />
                        <div className="text-sm text-muted-foreground">
                            <p>Dibuat: {format(new Date(data.createdAt), "dd MMMM yyyy HH:mm", { locale: idLocale })}</p>
                            <p>Diupdate: {format(new Date(data.updatedAt), "dd MMMM yyyy HH:mm", { locale: idLocale })}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Informasi Rekening */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Rekening Bank
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!data.bankAccounts || data.bankAccounts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>Belum ada rekening terdaftar</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.bankAccounts.map((account, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border ${account.isDefault ? "border-primary bg-primary/5" : ""
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold">{account.bankName}</span>
                                            {account.isDefault && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="font-mono text-lg">{account.accountNumber}</p>
                                        <p className="text-sm text-muted-foreground">
                                            a/n {account.accountName}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Vendor Bongkar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus vendor &quot;{data.name}&quot;?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                "Hapus"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
