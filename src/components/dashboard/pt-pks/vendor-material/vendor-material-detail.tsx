"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft, Package, Building2, Phone, Mail, MapPin, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface VendorMaterialDetailProps {
    vendor: {
        id: string;
        code: string;
        name: string;
        contactPerson: string;
        email: string | null;
        phone: string;
        address: string;
        npwp: string | null;
        taxStatus: string;
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        kategori: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    };
}

const taxStatusLabels: Record<string, string> = {
    NON_PKP: "Non PKP",
    PKP_11: "PKP 11%",
    PKP_1_1: "PKP 1.1%",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" }> = {
    ACTIVE: { label: "Aktif", variant: "default" },
    INACTIVE: { label: "Tidak Aktif", variant: "secondary" },
};

export function VendorMaterialDetail({ vendor }: VendorMaterialDetailProps) {
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{vendor.name}</h1>
                        <p className="text-muted-foreground">{vendor.code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={statusLabels[vendor.status]?.variant || "secondary"}>
                        {statusLabels[vendor.status]?.label || vendor.status}
                    </Badge>
                    <Button onClick={() => router.push(`/dashboard/pt-pks/master/vendor-material/${vendor.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Informasi Umum */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Informasi Umum
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Kode Vendor</p>
                            <p className="font-medium">{vendor.code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nama Vendor</p>
                            <p className="font-medium">{vendor.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Contact Person</p>
                            <p className="font-medium">{vendor.contactPerson}</p>
                        </div>
                        {vendor.kategori && (
                            <div>
                                <p className="text-sm text-muted-foreground">Kategori</p>
                                <Badge variant="outline">{vendor.kategori}</Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Kontak */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Kontak
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{vendor.phone}</p>
                        </div>
                        {vendor.email && (
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{vendor.email}</p>
                            </div>
                        )}
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <p className="font-medium">{vendor.address}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Informasi Pajak */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Informasi Pajak
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">NPWP</p>
                            <p className="font-medium">{vendor.npwp || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status Pajak</p>
                            <p className="font-medium">{taxStatusLabels[vendor.taxStatus] || vendor.taxStatus}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Informasi Rekening */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Informasi Rekening
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nama Bank</p>
                            <p className="font-medium">{vendor.bankName || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nomor Rekening</p>
                            <p className="font-medium">{vendor.accountNumber || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Nama Pemilik</p>
                            <p className="font-medium">{vendor.accountName || "-"}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Timestamp */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <p>
                            Dibuat:{" "}
                            {new Date(vendor.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                        <p>
                            Terakhir diupdate:{" "}
                            {new Date(vendor.updatedAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
