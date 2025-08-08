
"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Movement } from "@/lib/firestore";
import { getMovementsForItem } from "@/lib/firestore";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Entrada':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
      case 'Saída':
        return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      case 'Devolução':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
      case 'Auditoria':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      default:
        return 'outline';
    }
  };

interface MovementsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  item: any; 
}

export function MovementsSheet({ isOpen, onOpenChange, item }: MovementsSheetProps) {
  const [itemMovements, setItemMovements] = React.useState<Movement[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && item) {
      const fetchMovements = async () => {
        setIsLoading(true);
        const movements = await getMovementsForItem(item.id);

        const sortedMovements = movements.sort((a, b) => 
            parseISO(b.date).getTime() - parseISO(a.date).getTime()
        );
        setItemMovements(sortedMovements);
        setIsLoading(false);
      };
      fetchMovements();
    }
  }, [isOpen, item]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Histórico de Movimentações</SheetTitle>
          <SheetDescription>
            Veja o histórico completo de entradas, saídas e devoluções para o item <span className="font-semibold">{item?.name}</span>.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : itemMovements.length > 0 ? (
                    itemMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{format(parseISO(movement.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('font-normal', getBadgeVariant(movement.type))}>
                              {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{movement.quantity}</TableCell>
                        <TableCell>
                            {movement.responsible.includes("Operador:") ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {movement.responsible.split(" Operador:")[1]}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {movement.responsible.split(" Operador:")[0]}
                                </span>
                              </div>
                            ) : (
                              <span>{movement.responsible}</span>
                            )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhuma movimentação encontrada para este item.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
        </div>
        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
