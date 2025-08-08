"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { Upload } from "lucide-react";
import Image from "next/image";

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "O nome do item é obrigatório."),
  materialType: z.enum(["consumo", "permanente"]),
  itemCode: z.string().optional(),
  patrimony: z.string().optional(),
  unit: z.string().min(1, "A unidade é obrigatória."),
  initialQuantity: z.coerce.number().min(0, "A quantidade deve ser um número positivo."),
  category: z.string().min(1, "A seleção da categoria é obrigatória."),
  otherCategory: z.string().optional(),
  image: z.object({
    base64: z.string(),
    fileName: z.string(),
    contentType: z.string(),
  }).optional(),
  reference: z.string().min(1, "A referência é obrigatória."),
}).refine(data => {
  if (data.category === 'Outro') {
    return data.otherCategory && data.otherCategory.length > 0;
  }
  return true;
}, {
  message: "Por favor, especifique a categoria.",
  path: ["otherCategory"],
});

type AddItemFormValues = z.infer<typeof formSchema>;

interface AddItemSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onItemAdded: (item: AddItemFormValues) => void;
}

export function AddItemSheet({ isOpen, onOpenChange, onItemAdded }: AddItemSheetProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      materialType: "consumo",
      itemCode: "",
      patrimony: "",
      unit: "",
      initialQuantity: 0,
      category: "",
      image: undefined,
      reference: "",
    },
  });
  const categoryValue = form.watch("category");
  const materialType = form.watch("materialType");

  useEffect(() => {
    if (materialType === "consumo") {
      form.setValue("patrimony", "");
    }
  }, [materialType, form]);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setImagePreview(null);
    }
  }, [isOpen, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;

      const imageObject = {
        base64: base64String,
        fileName: file.name,
        contentType: file.type,
      };

      setImagePreview(base64String);
      form.setValue("image", imageObject);
    };
    reader.readAsDataURL(file);
  }
};

  const onSubmit = (data: AddItemFormValues) => {
    console.log("Payload enviado:", data);
    onItemAdded(data);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Adicionar Novo Item</SheetTitle>
          <SheetDescription>
            Preencha os detalhes do item para adicioná-lo ao inventário.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <FormLabel>Imagem do Produto</FormLabel>
                <div
                  className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <span>Clique para carregar</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Material</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consumo">Consumo</SelectItem>
                          <SelectItem value="permanente">Permanente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome/Descrição do Item</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Caneta Esferográfica Azul" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="itemCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Item</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Gerado Automaticamente" 
                        {...field} 
                        disabled
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="patrimony"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Patrimonial</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 123456"
                        {...field}
                        disabled={materialType === "consumo"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Un, Cx, Resma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Escritório">Escritório</SelectItem>
                          <SelectItem value="Limpeza">Limpeza</SelectItem>
                          <SelectItem value="Transito">Trânsito</SelectItem>
                          <SelectItem value="EPI">EPI</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {categoryValue === 'Outro' && (
                  <FormField
                    control={form.control}
                    name="otherCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique a Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome da nova categoria" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referência / Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Prateleira A-03, Gaveta 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="pt-4">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </SheetClose>
              <Button variant="accent" type="submit">Salvar Item</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}