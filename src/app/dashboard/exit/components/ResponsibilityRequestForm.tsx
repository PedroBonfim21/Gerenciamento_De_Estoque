"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

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
import { Textarea } from "@/components/ui/textarea";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/firestore";
import { finalizeExit } from "@/lib/firestore";
import { ItemSearch } from "../../components/item-search";
import { useAuth } from "@/contexts/AuthContext";

type RequestedItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    patrimony: string;
};

export default function ResponsibilityRequestForm() {
    const { toast } = useToast();
    const [responsibilityDate, setResponsibilityDate] = React.useState<Date | undefined>(undefined);
    const [responsibleName, setResponsibleName] = React.useState("");
    const [responsibleId, setResponsibleId] = React.useState("");
    const [projectDescription, setProjectDescription] = React.useState("");
    const [quantity, setQuantity] = React.useState(1);
    const [requestedItems, setRequestedItems] = React.useState<RequestedItem[]>([]);
    const [selectedItem, setSelectedItem] = React.useState<Product | null>(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
    const [isTermAccepted, setIsTermAccepted] = React.useState(false);
    const [isFinalizing, setIsFinalizing] = React.useState(false);
    const [department, setDepartment] = React.useState("");
    const { user } = useAuth();

    React.useEffect(() => {
        setResponsibilityDate(new Date());
    }, []);

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
            return [...prev, { id: selectedItem.id, name: selectedItem.name, quantity, unit: selectedItem.unit, patrimony: selectedItem.patrimony }];
        });
        setSelectedItem(null);
        setQuantity(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setRequestedItems(prev => prev.filter(item => item.id !== itemId));
    };
    
    const handleFinalizeResponsibility = () => {
        if (requestedItems.length === 0) {
            toast({ title: "Nenhum item adicionado", description: "Adicione pelo menos um item para gerar o termo.", variant: "destructive" });
            return;
        }
        if (!responsibleName || !responsibleId || !department) { 
            toast({ title: "Campos obrigatórios", description: "Por favor, preencha o nome, matrícula e setor do responsável.", variant: "destructive" });
            return;
        }
        setIsTermAccepted(false);
        setIsConfirmDialogOpen(true);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("TERMO DE RESPONSABILIDADE DE MATERIAIS PERMANENTES", pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const paragraphText = `Pelo presente termo, eu, ${responsibleName}, CPF ${responsibleId}, do setor ${department}, assumo a responsabilidade pelo recebimento e guarda dos materiais permanentes abaixo descritos, destinados ao uso exclusivo nas atividades institucionais.`;
        const splitText = doc.splitTextToSize(paragraphText, pageWidth - 40);
        doc.text(splitText, 20, 35);
        
        const tableColumn = ["Nº Patrimonial", "Descrição do Bem", "Est. de Conservação", "Localização"];
        const tableRows = requestedItems.map(item => [
            item.patrimony || "N/A",
            item.name,
            "Bom",
            department
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 60,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0,0,0], fontStyle: 'bold' },
        });

        const lastTableY = (doc as any).lastAutoTable.finalY;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Declaro estar ciente de que:", 20, lastTableY + 15);
        
        doc.setFont('helvetica', 'normal');
        const declarations = [
            "• É vedada a utilização do bem para fins particulares;",
            "• Sou responsável pela guarda, conservação e uso adequado;",
            "• Em caso de extravio, dano ou mau uso, devo comunicar imediatamente ao setor competente;",
            "• Este termo deverá ser renovado em caso de transferência de setor, baixa patrimonial ou substituição do bem."
        ];
        declarations.forEach((line, index) => {
            doc.text(line, 22, lastTableY + 22 + (index * 6));
        });


        const dateText = `Local e Data: __________________, ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}`;
        doc.text(dateText, 20, lastTableY + 55);

        const signatureY = pageHeight - 50;
        doc.text("_______________________________", 20, signatureY);
        doc.text("Assinatura do Responsável pelo Setor", 22, signatureY + 5);

        doc.text("_______________________________", pageWidth - 20 - 75, signatureY);
        doc.text("Assinatura do Servidor Responsável", pageWidth - 18 - 75, signatureY + 5);
        
        doc.text("_______________________________", pageWidth / 2, signatureY + 20, { align: 'center' });
        doc.text("Assinatura do Almoxarife/Patrimônio", pageWidth / 2, signatureY + 25, { align: 'center' });

        doc.save(`Termo_Resp_${responsibleName.replace(" ", "_")}_${new Date().toISOString().slice(0,10)}.pdf`);
    };
    const handleActionAndFinalize = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        if (!isTermAccepted) {
            toast({ title: "Termo não aceito", description: "Você deve aceitar os termos para continuar.", variant: "destructive" });
            return;
        }

        setIsFinalizing(true);
        try {
            await finalizeExit({
                items: requestedItems,
                date: responsibilityDate?.toISOString() || new Date().toISOString(),
                requester: `${responsibleName} (${responsibleId})`,
                department: department,
                purpose: projectDescription,
                responsible: `Responsável:${responsibleName} Operador:${user?.email || "Desconhecido"}`,
            });

            generatePDF();
            
            toast({ title: "Saída Registrada e PDF Gerado!", description: "O termo de responsabilidade foi gerado com sucesso.", variant: "success" });

            setIsConfirmDialogOpen(false);
            setResponsibilityDate(new Date());
            setResponsibleName("");
            setResponsibleId("");
            setDepartment("");
            setProjectDescription("");
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
        <>
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="responsibility-date" className="text-sm font-medium">Data da Solicitação</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button id="responsibility-date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !responsibilityDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {responsibilityDate ? format(responsibilityDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={responsibilityDate} onSelect={setResponsibilityDate} initialFocus locale={ptBR} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="responsible-name" className="text-sm font-medium">Nome do Responsável</label>
                                <Input id="responsible-name" value={responsibleName} onChange={e => setResponsibleName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="responsible-id" className="text-sm font-medium">Cpf do Responsável</label>
                                <Input id="responsible-id" value={responsibleId} onChange={e => setResponsibleId(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="department" className="text-sm font-medium">Setor</label>
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
                            <label htmlFor="project-description" className="text-sm font-medium">Descrição de Uso ou Projeto</label>
                            <Textarea id="project-description" value={projectDescription} onChange={e => setProjectDescription(e.target.value)} />
                        </div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Itens Sob Responsabilidade</CardTitle>
                                <div className="flex flex-col md:flex-row items-end gap-2 pt-4">
                                    <ItemSearch 
                                        onSelectItem={setSelectedItem} 
                                        materialType="permanente" 
                                        placeholder="Buscar item permanente..." 
                                        searchId="responsibility-search" 
                                    />
                                    <div className="w-full md:w-24">
                                        <label htmlFor="quantity-responsibility" className="text-sm font-medium">Qtd.</label>
                                        <Input id="quantity-responsibility" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min="1" />
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
                                                <TableHead>Nº Patrimônio</TableHead>
                                                <TableHead className="w-[100px] text-right">Qtd</TableHead>
                                                <TableHead className="w-[100px] text-center">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requestedItems.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum item adicionado.</TableCell>
                                                </TableRow>
                                            ) : (
                                                requestedItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell>{item.patrimony}</TableCell>
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
                        <Button size="lg" variant="accent" onClick={handleFinalizeResponsibility} disabled={isFinalizing || requestedItems.length === 0}>
                            {isFinalizing ? "Finalizando..." : "Gerar Termo e Finalizar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Geração de Termo</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="text-sm">
                        <p>Você está prestes a finalizar a saída e gerar um Termo de Responsabilidade em PDF para os itens listados.</p>
                        <p className="font-semibold mt-2">Responsável: {responsibleName}</p>
                        <p className="font-semibold">Setor: {department}</p>
                        <br />
                        <p>Deseja continuar?</p>
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox id="terms-pdf" checked={isTermAccepted} onCheckedChange={(checked) => setIsTermAccepted(checked as boolean)} />
                        <Label htmlFor="terms-pdf">Declaro que os dados estão corretos e aceito os termos.</Label>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleActionAndFinalize} disabled={!isTermAccepted || isFinalizing}>
                            {isFinalizing ? "Gerando PDF..." : "Confirmar e Gerar PDF"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    