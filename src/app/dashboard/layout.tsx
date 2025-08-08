"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut, User } from "firebase/auth";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  CircleUser,
  LayoutDashboard,
  LogOut,
  Package,
  ArrowRightToLine,
  ArrowLeftFromLine,
  Settings,
  ChevronsLeftRight,
  Warehouse,
  Loader2,
} from "lucide-react";
import {
  Users
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";


function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, userRole } = useAuth();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Painel" },
    { href: "/dashboard/inventory", icon: Package, label: "Inventário" },
    { href: "/dashboard/entry", icon: ArrowRightToLine, label: "Entrada" },
    { href: "/dashboard/exit", icon: ArrowLeftFromLine, label: "Saída" },
    { href: "/dashboard/returns", icon: ChevronsLeftRight, label: "Devolução" },
  ];

  const adminNavItems = [
    { href: "/dashboard/users", icon: Users, label: "Usuários", adminOnly: true },
  ]

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ 
        title: "Você saiu com sucesso.",
        description: "Redirecionando para a página de login.",
        variant: "success",
      });
      router.push("/login");
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="mb-3 ml-5">
            <div className="flex items-center gap-2 p-2">
                <Warehouse className="w-8 h-8 text-primary" />
                <span className="text-xl font-semibold mt-1">AlmoxFlow</span>
            </div>
        </SidebarHeader>
        <hr className="mx-6" />
        <SidebarContent className="mt-4">
            <SidebarMenu>
              {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className="h-12 justify-start"
                  >
                      <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
              ))}
              {userRole === 'Admin' && adminNavItems.map((item) => (
                 <SidebarMenuItem key={item.label}>
                 <SidebarMenuButton
                     asChild
                     isActive={pathname === item.href}
                     tooltip={item.label}
                     className="h-12 justify-start"
                 >
                     <Link href={item.href}>
                     <item.icon />
                     <span>{item.label}</span>
                     </Link>
                 </SidebarMenuButton>
                 </SidebarMenuItem>
              ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="mb-5 mt-1">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="justify-start w-full h-auto px-2 py-2">
                <div className="flex justify-between w-full items-center">
                    <div className="flex gap-2 items-center">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback>{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-sm">
                        <span className="font-medium text-sidebar-foreground">
                            {user.email && user.email.length > 18
                                  ? `${user.email.substring(0, 18)}...`
                                  : user.email}
                        </span>
                        <span className="text-muted-foreground text-xs">{userRole}</span>
                    </div>
                    </div>
                </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:px-6 md:hidden">
            <SidebarTrigger className="sm:hidden -ml-2" />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full ml-auto"
                >
                <CircleUser className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userRole}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
