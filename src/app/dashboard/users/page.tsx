"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/lib/firestore";
import { getUsers, updateUserRole } from "@/lib/firestore";
import { Loader2, ShieldCheck, User as UserIcon } from "lucide-react";

export default function UsersPage() {
  const { userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!authLoading && userRole !== 'Admin') {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      router.replace('/dashboard');
    }
  }, [userRole, authLoading, router, toast]);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const usersFromDb = await getUsers();
      setUsers(usersFromDb);
    } catch (error) {
      toast({
        title: "Erro ao Carregar Usuários",
        description: "Não foi possível buscar os usuários do banco de dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    if (userRole === 'Admin') {
      fetchUsers();
    }
  }, [userRole, fetchUsers]);

  const handleRoleChange = async (uid: string, newRole: 'Admin' | 'Operator') => {
    try {
      await updateUserRole(uid, newRole);
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.uid === uid ? { ...user, role: newRole } : user))
      );
      toast({
        title: "Função Atualizada!",
        description: "A função do usuário foi alterada com sucesso.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Erro ao Atualizar Função",
        description: "Não foi possível alterar a função do usuário.",
        variant: "destructive",
      });
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (userRole !== 'Admin') {
    return null; 
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Visualize e altere as permissões de cada usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[200px]">Função (Role)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole: 'Admin' | 'Operator') =>
                          handleRoleChange(user.uid, newRole)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-red-600" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="Operator">
                             <div className="flex items-center gap-2">
                               <UserIcon className="h-4 w-4" />
                               Operator
                             </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}