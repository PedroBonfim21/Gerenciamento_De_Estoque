
export const products = [
    {
      id: "1",
      image: "https://placehold.co/40x40.png",
      name: "Caneta Azul",
      code: "001-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 92,
      unit: "und",
      category: "Escritório",
    },
    {
      id: "2",
      image: "https://placehold.co/40x40.png",
      name: "Caneta Preta",
      code: "002-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 63,
      unit: "und",
      category: "Escritório",
    },
    {
      id: "3",
      image: "https://placehold.co/40x40.png",
      name: "Caneta Vermelha",
      code: "003-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 19,
      unit: "und",
      category: "Escritório",
    },
    {
      id: "4",
      image: "https://placehold.co/40x40.png",
      name: "Papel A4",
      code: "005-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 11,
      unit: "Resma",
      category: "Escritório",
    },
    {
      id: "5",
      image: "https://placehold.co/40x40.png",
      name: "Monitor Dell 24'",
      code: "004-25",
      patrimony: "123456",
      type: "permanente",
      quantity: 1,
      unit: "und",
      category: "Informática",
    },
    {
      id: "6",
      image: "https://placehold.co/40x40.png",
      name: "Mouse Logitech",
      code: "006-25",
      patrimony: "123457",
      type: "permanente",
      quantity: 5,
      unit: "und",
      category: "Informática",
    },
    {
      id: "7",
      image: "https://placehold.co/40x40.png",
      name: "Teclado ABNT2",
      code: "007-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 8,
      unit: "und",
      category: "Informática",
    },
     {
      id: "8",
      image: "https://placehold.co/40x40.png",
      name: "Cadeira de Escritório",
      code: "008-25",
      patrimony: "123458",
      type: "permanente",
      quantity: 3,
      unit: "und",
      category: "Mobiliário",
    },
    {
      id: "9",
      image: "https://placehold.co/40x40.png",
      name: "Grampeador",
      code: "009-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 25,
      unit: "und",
      category: "Escritório",
    },
    {
      id: "10",
      image: "https://placehold.co/40x40.png",
      name: "Clips de Papel",
      code: "010-25",
      patrimony: "N/A",
      type: "consumo",
      quantity: 10,
      unit: "caixa",
      category: "Escritório",
    },
  ];
  
  type Movement = {
    id: string;
    productId: string;
    date: string;
    type: 'Entrada' | 'Saída' | 'Devolução';
    quantity: number;
    responsible: string;
    department?: string;
  };
  
  export let movements: Movement[] = [
      { id: '1', productId: '1', date: '2024-05-20T07:00:00Z', type: 'Entrada', quantity: 50, responsible: 'João Silva', department: 'Almoxarifado' },
      { id: '2', productId: '1', date: '2024-05-21T11:30:00Z', type: 'Saída', quantity: 10, responsible: 'Maria Oliveira', department: 'RH' },
      { id: '3', productId: '2', date: '2024-05-22T06:15:00Z', type: 'Saída', quantity: 5, responsible: 'Carlos Pereira', department: 'Financeiro' },
      { id: '4', productId: '3', date: '2024-05-23T08:00:00Z', type: 'Entrada', quantity: 20, responsible: 'João Silva', department: 'Almoxarifado' },
      { id: '5', productId: '1', date: '2024-05-24T13:45:00Z', type: 'Devolução', quantity: 2, responsible: 'Ana Costa', department: 'RH' },
      { id: '6', productId: '4', date: '2024-05-25T10:00:00Z', type: 'Saída', quantity: 5, responsible: 'José Santos', department: 'TI' },
      { id: '7', productId: '5', date: '2024-05-26T14:20:00Z', type: 'Saída', quantity: 1, responsible: 'Mariana Lima', department: 'Diretoria' },
      { id: '8', productId: '6', date: '2024-05-27T09:00:00Z', type: 'Entrada', quantity: 10, responsible: 'João Silva', department: 'Almoxarifado' },
      { id: '9', productId: '7', date: '2024-05-28T16:00:00Z', type: 'Saída', quantity: 3, responsible: 'Pedro Martins', department: 'TI' },
      { id: '10', productId: '8', date: '2024-05-29T11:00:00Z', type: 'Saída', quantity: 2, responsible: 'Beatriz Costa', department: 'RH' },
      { id: '11', productId: '9', date: '2024-05-30T15:00:00Z', type: 'Entrada', quantity: 30, responsible: 'João Silva', department: 'Almoxarifado' },
      { id: '12', productId: '10', date: '2024-06-01T10:30:00Z', type: 'Saída', quantity: 5, responsible: 'Carlos Pereira', department: 'Financeiro' },
      { id: '13', productId: '2', date: '2024-06-02T13:00:00Z', type: 'Saída', quantity: 10, responsible: 'Maria Oliveira', department: 'RH' },
      { id: '14', productId: '4', date: '2024-06-03T09:45:00Z', type: 'Devolução', quantity: 1, responsible: 'José Santos', department: 'TI' },
      { id: '15', productId: '1', date: '2024-06-04T12:00:00Z', type: 'Saída', quantity: 15, responsible: 'Ana Costa', department: 'Comercial' },
      { id: '16', productId: '4', date: '2024-06-04T12:01:00Z', type: 'Saída', quantity: 15, responsible: 'Ana Costa', department: 'Comercial' },
      { id: '17', productId: '4', date: '2024-06-05T12:01:00Z', type: 'Saída', quantity: 2, responsible: 'Ana Costa', department: 'Comercial' },

  ];
  

export const addMovement = (movement: Omit<Movement, 'id'>) => {
    console.log("Mock addMovement called. In a real app, this would be a Firestore call.");
};
