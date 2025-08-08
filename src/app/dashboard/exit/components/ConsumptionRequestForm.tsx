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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/firestore";
import { finalizeExit } from "@/lib/firestore";
import { ItemSearch } from "../../components/item-search";

type RequestedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

export default function ConsumptionRequestForm() {
    const { toast } = useToast();
    const [requestDate, setRequestDate] = React.useState<Date | undefined>(new Date());
    const [requesterName, setRequesterName] = React.useState("");
    const [requesterId, setRequesterId] = React.useState("");
    const [department, setDepartment] = React.useState("");
    const [purpose, setPurpose] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [requestedItems, setRequestedItems] = React.useState<RequestedItem[]>([]);
    const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
    const [isFinalizing, setIsFinalizing] = React.useState(false);

    const { user } = useAuth();
    
    const handleAddItem = () => {
        if (!selectedItem) {
            toast({ title: "Erro", description: "Por favor, busque e selecione um item.", variant: "destructive" });
            return;
        }

        if (quantity <= 0) {
            toast({ title: "Quantidade inválida", description: "A quantidade deve ser maior que zero.", variant: "destructive" });
            return;
        }

        if (selectedItem.quantity < quantity) {
            toast({ title: "Estoque insuficiente", description: `A quantidade solicitada (${quantity}) é maior que a disponível (${selectedItem.quantity}).`, variant: "destructive" });
            return;
        }

        setRequestedItems((prev) => {
            const existing = prev.find((i) => i.id === selectedItem.id);
            if (existing) {
                const newQuantity = existing.quantity + quantity;
                if (selectedItem.quantity < newQuantity) {
                    toast({ title: "Estoque insuficiente", description: `A quantidade total solicitada (${newQuantity}) é maior que a disponível (${selectedItem.quantity}).`, variant: "destructive" });
                    return prev;
                }
                return prev.map((i) => i.id === selectedItem.id ? { ...i, quantity: newQuantity } : i);
            }
            return [...prev, { id: selectedItem.id, name: selectedItem.name, quantity, unit: selectedItem.unit }];
        });

        setSelectedItem(null);
        setQuantity(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setRequestedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleFinalizeIssue = async () => {
        if (requestedItems.length === 0) {
            toast({ title: "Nenhum item solicitado", description: "Adicione pelo menos um item para registrar a saída.", variant: "destructive" });
            return;
        }

        if (!requesterName || !requesterId || !department) {
            toast({ title: "Campos obrigatórios", description: "Por favor, preencha o nome, matrícula e setor do solicitante.", variant: "destructive" });
            return;
        }
        
        setIsFinalizing(true);
        try {
            await finalizeExit({
                items: requestedItems,
                date: requestDate?.toISOString() || new Date().toISOString(),
                requester: `${requesterName} (${requesterId})`,
                department: department,
                purpose: purpose,
                responsible: user?.email || "Desconhecido",
            });
            
            toast({ title: "Saída Registrada!", description: "A saída de materiais de consumo foi registrada com sucesso.", variant: "success" });

            setRequestDate(new Date());
            setRequesterName("");
            setRequesterId("");
            setDepartment("");
            setPurpose("");
            setRequestedItems([]);
        } catch (error: any) {
             toast({
                title: "Erro ao Finalizar Saída",
                description: error.message || "Não foi possível registrar a saída. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="request-date" className="text-sm font-medium">Data da Solicitação</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="request-date"
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !requestDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {requestDate ? format(requestDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={requestDate} onSelect={setRequestDate} initialFocus locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="requester-name" className="text-sm font-medium">Nome do Solicitante</label>
                            <Input id="requester-name" value={requesterName} onChange={e => setRequesterName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="requester-id" className="text-sm font-medium">Matrícula do Solicitante</label>
                            <Input id="requester-id" value={requesterId} onChange={e => setRequesterId(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                            <label htmlFor="department" className="text-sm font-medium">Setor/Departamento</label>
                            <Select onValueChange={setDepartment} value={department}>
                                <SelectTrigger id="department">
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
                        <label htmlFor="purpose" className="text-sm font-medium">Finalidade de Uso</label>
                        <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Itens Solicitados</CardTitle>
                            <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                               <ItemSearch onSelectItem={setSelectedItem} materialType="consumo" placeholder="Buscar item de consumo..." searchId="consumption-search" />
                                <div className="w-full md:w-24">
                                    <label htmlFor="quantity-consumption" className="text-sm font-medium">Qtd.</label>
                                    <Input id="quantity-consumption" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                                </div>
                                <Button onClick={handleAddItem} className="w-full md:w-auto">Adicionar</Button>
                            </div>
                             {selectedItem && (
                                <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                                    Item selecionado: <span className="font-medium">{selectedItem.name}</span> (Disponível: {selectedItem.quantity})
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
                                        {requestedItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    Nenhum item solicitado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            requestedItems.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100" onClick={() => handleRemoveItem(item.id)}>
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
                    <Button size="lg" variant="accent" onClick={handleFinalizeIssue} disabled={isFinalizing || requestedItems.length === 0}>
                        {isFinalizing ? "Finalizando..." : "Finalizar Saída"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}