
"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/firestore";
import { finalizeReturn } from "@/lib/firestore";
import { ItemSearch } from "../components/item-search";
import { useAuth } from "@/contexts/AuthContext";

type ReturnedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

export default function ReturnsPage() {
    
    const { toast } = useToast();
    const [returnDate, setReturnDate] = React.useState<Date | undefined>(undefined);
    const [returningDepartment, setReturningDepartment] = React.useState("");
    const [returnReason, setReturnReason] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [returnedItems, setReturnedItems] = React.useState<ReturnedItem[]>([]);
    const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
    const [isFinalizing, setIsFinalizing] = React.useState(false);
    const [department, setDepartment] = React.useState("");
    const [otherReturnReason, setOtherReturnReason] = React.useState("");
    const { user } = useAuth();

    React.useEffect(() => {
        setReturnDate(new Date());
    }, []);

    const handleAddToList = () => {
        if (!selectedItem) {
             toast({
                title: "Item não selecionado",
                description: "Por favor, busque e selecione um item.",
                variant: "destructive"
            });
            return;
        }

        if (quantity <= 0) {
            toast({
                title: "Quantidade inválida",
                description: "Por favor, insira uma quantidade maior que zero.",
                variant: "destructive",
            });
            return;
        }

        setReturnedItems(prev => {
            const existing = prev.find(i => i.id === selectedItem.id);
            if (existing) {
                return prev.map(i => i.id === selectedItem.id ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { id: selectedItem.id, name: selectedItem.name, quantity, unit: selectedItem.unit }];
        });

        setSelectedItem(null);
        setQuantity(1);
    };

    const handleRemoveFromList = (itemId: string) => {
        setReturnedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleFinalizeReturn = async () => {
        if (returnedItems.length === 0) {
            toast({
                title: "Nenhum item adicionado",
                description: "Adicione pelo menos um item para registrar a devolução.",
                variant: "destructive"
            });
            return;
        }

        if (!returningDepartment || !returnReason) {
            toast({
                title: "Campos obrigatórios",
                description: "Por favor, preencha o setor e o motivo da devolução.",
                variant: "destructive"
            });
            return;
        }

        setIsFinalizing(true);
        try {
            await finalizeReturn({
                items: returnedItems,
                date: returnDate?.toISOString() || new Date().toISOString(),
                department: returningDepartment,
                reason: returnReason,
                responsible: user?.email || "Desconhecido",
            });

            toast({
                title: "Devolução Registrada!",
                description: "A devolução de materiais foi registrada com sucesso.",
                variant: "success"
            });

            setReturnDate(new Date());
            setReturningDepartment("");
            setReturnReason("");
            setReturnedItems([]);
        } catch (error: any) {
            toast({
                title: "Erro ao Finalizar Devolução",
                description: error.message || "Não foi possível registrar a devolução. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Registrar Devolução de Materiais</h1>

            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="return-date" className="text-sm font-medium">Data da Devolução</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="return-date"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !returnDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {returnDate ? format(returnDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus locale={ptBR} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="returning-department" className="text-sm font-medium">Setor Devolvente</label>
                                <Select value={returningDepartment} onValueChange={setReturningDepartment}>
                                    <SelectTrigger id="returning-department">
                                        <SelectValue placeholder="Selecione um setor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Administracao">Administração</SelectItem>
                                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                                        <SelectItem value="Recepção">Recepção</SelectItem>
                                        <SelectItem value="Outro">Outros setores</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="return-reason" className="text-sm font-medium">Motivo</label>
                                 <Select value={returnReason} onValueChange={setReturnReason}>
                                    <SelectTrigger id="return-reason">
                                        <SelectValue placeholder="Selecione o motivo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Material não utilizado">Material não utilizado</SelectItem>
                                        <SelectItem value="Material em excesso">Material em excesso</SelectItem>
                                        <SelectItem value="Material com defeito">Material com defeito</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className={cn(
                            "overflow-hidden transition-[max-height,opacity] duration-1000 ease-in-out",
                            returnReason === 'Outro' ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                        )}>
                            <div className="space-y-2">
                                <label htmlFor="other-reason" className="text-sm font-medium border-t">Especifique o Motivo</label>
                                <Input 
                                    id="other-reason" 
                                    value={otherReturnReason} 
                                    onChange={e => setOtherReturnReason(e.target.value)} 
                                    placeholder="Digite o motivo da devolução"
                                    tabIndex={returnReason === 'Outro' ? 0 : -1}
                                />
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Itens Devolvidos</CardTitle>
                                <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                    <ItemSearch onSelectItem={setSelectedItem} searchId="return-item-search" />
                                    <div className="w-full md:w-24">
                                        <label htmlFor="quantity" className="text-sm font-medium">Qtd.</label>
                                        <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                                    </div>
                                    <Button onClick={handleAddToList} className="w-full md:w-auto">Adicionar</Button>
                                </div>
                                {selectedItem && (
                                    <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                                        Item selecionado: <span className="font-medium">{selectedItem.name}</span>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item</TableHead>
                                                <TableHead className="w-[100px] text-right">Qtd</TableHead>
                                                <TableHead className="w-[100px] text-center">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {returnedItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                        Nenhum item adicionado à devolução.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                returnedItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleRemoveFromList(item.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button 
                            size="lg" 
                            variant="accent" 
                            onClick={handleFinalizeReturn} 
                            disabled={isFinalizing || returnedItems.length === 0}
                        >
                             {isFinalizing ? "Finalizando..." : "Finalizar Devolução"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
