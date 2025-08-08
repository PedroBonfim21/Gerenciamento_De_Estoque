"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2, PlusCircle } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { AddItemSheet } from "../inventory/components/add-item-sheet";
import { ItemSearch } from "../components/item-search";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/firestore";
import { addProduct, finalizeEntry, uploadImage, addMovement, generateNextItemCode } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext"; 

type ReceivedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
};

export default function EntryPage() {
    const { toast } = useToast();
    const [entryDate, setEntryDate] = React.useState<Date | undefined>(new Date());
    const [supplier, setSupplier] = React.useState("");
    const [invoice, setInvoice] = React.useState("");
    const [responsible, setResponsible] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [receivedItems, setReceivedItems] = React.useState<ReceivedItem[]>([]);
    
    const [isAddItemSheetOpen, setIsAddItemSheetOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isFinalizing, setIsFinalizing] = React.useState(false);
    const [selectedItemForAddition, setSelectedItemForAddition] = React.useState<Product | null>(null);
    const [entryType, setEntryType] = React.useState<'Oficial' | 'Não Oficial'>('Oficial');
    const { user } = useAuth();

    const handleSelectSearchItem = (item: Product) => {
        setSelectedItemForAddition(item);
    }
    
    const handleAddToList = () => {
        const item = selectedItemForAddition;
        if (!item) {
            toast({
                title: "Nenhum item selecionado",
                description: "Por favor, busque e selecione um item da lista.",
                variant: "destructive",
            });
            return;
        };
        
        if (quantity <= 0) {
            toast({
                title: "Quantidade inválida",
                description: "Por favor, insira uma quantidade maior que zero.",
                variant: "destructive",
            });
            return;
        }

        setReceivedItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, { id: item.id, name: item.name, quantity, unit: item.unit }];
        });
        
        setQuantity(1);
        setSelectedItemForAddition(null);
    };

    const handleRemoveFromList = (itemId: string) => {
        setReceivedItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleItemAdded = async (newItemData: any) => {
        setIsLoading(true);
        try {
            let imageUrl = "https://placehold.co/40x40.png";
            if (newItemData.image) {
                imageUrl = await uploadImage(newItemData.image);
            }

            const categoryPrefix = (newItemData.category === 'Outro' ? newItemData.otherCategory : newItemData.category).substring(0, 3).toUpperCase();
            const namePrefix = newItemData.name.substring(0, 3).toUpperCase();
            const codePrefix = `${categoryPrefix}-${namePrefix}`;
            const generatedCode = await generateNextItemCode(codePrefix);
            const finalCategory = newItemData.category === 'Outro' && newItemData.otherCategory ? newItemData.otherCategory : newItemData.category;

            const newProductData: Omit<Product, 'id'> = {
                name: newItemData.name,
                name_lowercase: newItemData.name.toLowerCase(),
                code: generatedCode,
                unit: newItemData.unit,
                patrimony: newItemData.materialType === 'permanente' ? newItemData.patrimony : 'N/A',
                type: newItemData.materialType,
                quantity: 0, 
                category: finalCategory,
                reference: newItemData.reference,
                image: imageUrl,
            };
            
            const newProductId = await addProduct(newProductData);
            
            toast({
                title: "Item Adicionado!",
                description: `${newProductData.name} foi adicionado ao inventário.`,
            });
            
            if (newItemData.initialQuantity > 0) {
                setReceivedItems(prev => [...prev, {
                    id: newProductId,
                    name: newProductData.name,
                    quantity: newItemData.initialQuantity,
                    unit: newProductData.unit
                }]);
            }
        } catch (error) {
             toast({
                title: "Erro ao Adicionar Item",
                description: "Não foi possível adicionar o novo item.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setIsAddItemSheetOpen(false);
        }
    };

    const handleFinalizeEntry = async () => {
    if (receivedItems.length === 0 || !supplier || !responsible) {
        toast({ title: "Campos obrigatórios", description: "Preencha a data, fornecedor/secretaria, responsável e adicione pelo menos um item.", variant: "destructive" });
        return;
    }
    if (entryType === 'Oficial' && !invoice) {
        toast({ title: "Campo obrigatório", description: "Para entradas oficiais, a nota fiscal é obrigatória.", variant: "destructive" });
        return;
    }

    setIsFinalizing(true);
    try {
        const entryPayload = {
            items: receivedItems,
            date: entryDate?.toISOString() || new Date().toISOString(),
            supplier: supplier,
            responsible: `Responsável:${responsible} Operador:${user?.email || "Desconhecido"}`,
            entryType: entryType,
            invoice: entryType === 'Oficial' ? invoice : undefined,
        };
        if (entryType === 'Oficial') {
            entryPayload.invoice = invoice;
        }

        await finalizeEntry(entryPayload);
        
        toast({ title: "Entrada Registrada!", description: "A entrada de materiais foi registrada com sucesso.", variant: "success" });

        setEntryDate(new Date());
        setSupplier("");
        setInvoice("");
        setResponsible("");
        setReceivedItems([]);
        
    } catch (error: any) {
        toast({
            title: "Erro ao Finalizar Entrada",
            description: error.message || "Não foi possível registrar a entrada. Tente novamente.",
            variant: "destructive"
        });
    } finally {
        setIsFinalizing(false);
    }
};

    return (
    <>
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Registrar Entrada de Materiais</h1>
                <p className="text-muted-foreground">
                    Preencha os dados e adicione os itens recebidos.
                </p>
            </div>
            </div>

            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="entry-date" className="text-sm font-medium">Data da Entrada</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="entry-date"
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !entryDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {entryDate ? format(entryDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={entryDate} onSelect={setEntryDate} initialFocus locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo de Entrada</label>
                            <Select onValueChange={(value: 'Oficial' | 'Não Oficial') => setEntryType(value)} value={entryType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Oficial">Oficial (com Nota Fiscal)</SelectItem>
                                    <SelectItem value="Não Oficial">Não Oficial (Transferência/Doação)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="supplier" className="text-sm font-medium">
                                {entryType === 'Oficial' ? 'Fornecedor' : 'Origem'}
                            </label>
                            <Input id="supplier" value={supplier} onChange={e => setSupplier(e.target.value)} />
                        </div>

                        {entryType === 'Oficial' && (
                            <div className="space-y-2">
                                <label htmlFor="invoice" className="text-sm font-medium">Nota Fiscal</label>
                                <Input id="invoice" value={invoice} onChange={e => setInvoice(e.target.value)} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="responsible" className="text-sm font-medium">Responsável pelo Recebimento</label>
                            <Input id="responsible" value={responsible} onChange={e => setResponsible(e.target.value)} />
                        </div>
                    </div>
                
                    <Card>
                        <CardHeader>
                            <CardTitle>Itens Recebidos</CardTitle>
                            <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                <ItemSearch 
                                    onSelectItem={handleSelectSearchItem} 
                                    searchId="entry-item-search"
                                    onRegisterNewItem={() => setIsAddItemSheetOpen(true)}
                                />
                                <div className="w-full md:w-24">
                                    <label htmlFor="quantity" className="text-sm font-medium">Qtd.</label>
                                    <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
                                </div>
                                <Button onClick={handleAddToList} className="w-full md:w-auto">Adicionar</Button>
                            </div>
                            {selectedItemForAddition && (
                                <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                                    Item selecionado: <span className="font-medium">{selectedItemForAddition.name}</span>
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
                                       {receivedItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                    Nenhum item adicionado à entrada.
                                                </TableCell>
                                            </TableRow>
                                       ) : (
                                            receivedItems.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right">{`${item.quantity} ${item.unit}`}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-100 h-auto p-0" onClick={() => handleRemoveFromList(item.id)}>
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
                    <div className="flex justify-end">
                        <Button size="lg" className="bg-accent" onClick={handleFinalizeEntry} disabled={isFinalizing || receivedItems.length === 0}>
                            {isFinalizing ? "Finalizando..." : "Finalizar Entrada"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
        <AddItemSheet 
            isOpen={isAddItemSheetOpen}
            onOpenChange={setIsAddItemSheetOpen}
            onItemAdded={handleItemAdded}
        />
    </>
  );
}