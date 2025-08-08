
"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConsumptionRequestForm from "./components/ConsumptionRequestForm";
import ResponsibilityRequestForm from "./components/ResponsibilityRequestForm";

export default function ExitPage() {
  const [activeTab, setActiveTab] = React.useState("consumption");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Registrar Saída de Materiais</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="consumption">Requisição de Consumo</TabsTrigger>
          <TabsTrigger value="responsibility">Termo de Responsabilidade</TabsTrigger>
        </TabsList>
        <TabsContent value="consumption">
          <ConsumptionRequestForm />
        </TabsContent>
        <TabsContent value="responsibility">
          <ResponsibilityRequestForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
