"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const settingsMenus = [
    {
      title: "Manajemen User",
      description: "Kelola user, tambah user baru, dan reset password",
      icon: Users,
      href: "/dashboard/pt-pks/settings/users",
    },
    {
      title: "Roles & Permissions",
      description: "Kelola role dan hak akses user",
      icon: Shield,
      href: "/dashboard/pt-pks/settings/roles",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola pengaturan sistem dan akses user
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsMenus.map((menu) => (
          <Card key={menu.href} className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <menu.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{menu.title}</CardTitle>
                  <CardDescription>{menu.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(menu.href)}
              >
                Kelola
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
