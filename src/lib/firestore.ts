import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, runTransaction, increment, QueryConstraint, orderBy, limit, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { parseISO } from 'date-fns';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export type Product = {
    id: string;
    image?: string;
    name: string;
    name_lowercase: string;
    code: string;
    patrimony: string;
    type: 'consumo' | 'permanente';
    quantity: number;
    unit: string;
    category: string;
    reference: string;
};

export type Movement = {
    id: string;
    productId: string;
    date: string; 
    type: 'Entrada' | 'Saída' | 'Devolução' | "Auditoria";
    entryType?: 'Oficial' | 'Não Oficial';
    quantity: number;
    responsible: string;
    department?: string;
    supplier?: string;
    invoice?: string;
    productType?: 'consumo' | 'permanente';
    changes?: string;
};

type EntryData = {
    items: { id: string; quantity: number }[];
    date: string;
    supplier: string;
    invoice?: string;
    responsible: string;
    entryType: 'Oficial' | 'Não Oficial';
}

type ExitData = {
    items: { id: string; quantity: number }[];
    date: string;
    requester: string;
    department: string;
    purpose?: string;
    responsible: string;
}

type ReturnData = {
    items: { id: string; quantity: number }[];
    date: string;
    department: string;
    reason: string;
    responsible: string;
}

type MovementFilters = {
  startDate?: string;
  endDate?: string;
  movementType?: string;
  materialType?: string;
  department?: string;
};

type ProductFilters = {
    searchTerm?: string;
    materialType?: 'consumo' | 'permanente';
}

const productsCollection = collection(db, 'products');
const movementsCollection = collection(db, 'movements');

export const getUserRole = async (uid: string): Promise<string | null> => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().role || null;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar a função do utilizador:", error);
    return null;
  }
};

export const getProducts = async (filters: ProductFilters = {}): Promise<Product[]> => {
    const { searchTerm, materialType } = filters;
    const constraints: QueryConstraint[] = [];

    if (materialType) {
        constraints.push(where('type', '==', materialType));
    }

    if (searchTerm && searchTerm.length > 0) {
        const lowercasedTerm = searchTerm.toLowerCase();
        const nameQuery = query(productsCollection, ...constraints, 
            orderBy('name_lowercase'), 
            where('name_lowercase', '>=', lowercasedTerm), 
            where('name_lowercase', '<=', lowercasedTerm + '\uf8ff')
        );
        const codeQuery = query(productsCollection, ...constraints, 
            where('code', '==', searchTerm)
        );

        const [nameSnapshot, codeSnapshot] = await Promise.all([
            getDocs(nameQuery),
            getDocs(codeQuery)
        ]);

        const productsMap = new Map<string, Product>();
        nameSnapshot.docs.forEach(doc => productsMap.set(doc.id, { id: doc.id, ...doc.data() } as Product));
        codeSnapshot.docs.forEach(doc => productsMap.set(doc.id, { id: doc.id, ...doc.data() } as Product));

        return Array.from(productsMap.values());
    } else {
        constraints.push(orderBy('name_lowercase'));
        const finalQuery = query(productsCollection, ...constraints);
        const snapshot = await getDocs(finalQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    }
};


export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const docRef = await addDoc(productsCollection, productData);
    return docRef.id;
};

export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await updateDoc(productDoc, productData);
};

export const deleteProduct = async (productId: string): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};

type ImageObject = {
  base64: string;
  fileName: string;
  contentType: string;
};

export const uploadImage = async (imageObject: ImageObject) => {
  if (!imageObject || !imageObject.base64) {
    return "https://placehold.co/40x40.png";
  }
  try {
    const { base64, fileName, contentType } = imageObject;
    const storage = getStorage();
    const storageRef = ref(storage, `products/${Date.now()}_${fileName}`);
    const metadata = { contentType: contentType };
    const snapshot = await uploadString(storageRef, base64, 'data_url', metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem com Base64:", error);
    throw error;
  }
};

export const generateNextItemCode = async (prefix: string): Promise<string> => {
  const q = query(
    productsCollection,
    where('code', '>=', prefix),
    where('code', '<=', prefix + '\uf8ff'),
    orderBy('code', 'desc'),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return `${prefix}-001`;
  } else {
    const lastCode = querySnapshot.docs[0].data().code;
    const lastNumber = parseInt(lastCode.split('-').pop() || '0', 10);
    const nextNumber = lastNumber + 1;
    const formattedNextNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}-${formattedNextNumber}`;
  }
};

export const finalizeEntry = async (entryData: EntryData): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            for (const item of entryData.items) {
                const productRef = doc(db, "products", item.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error(`Produto com ID ${item.id} não encontrado.`);
                }
                
                transaction.update(productRef, { quantity: increment(item.quantity) });

                const movementData: Omit<Movement, 'id'> = {
                    productId: item.id,
                    date: entryData.date,
                    type: 'Entrada',
                    quantity: item.quantity,
                    responsible: entryData.responsible,
                    supplier: entryData.supplier,
                    entryType: entryData.entryType,
                    productType: productDoc.data().type,
                };

                if (entryData.invoice) {
                    movementData.invoice = entryData.invoice;
                }

                const movementRef = doc(collection(db, "movements"));
                transaction.set(movementRef, movementData);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const finalizeExit = async (exitData: ExitData): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            for (const item of exitData.items) {
                const productRef = doc(db, "products", item.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error(`Produto com ID ${item.id} não encontrado.`);
                }
                
                const currentQuantity = productDoc.data().quantity;
                if (currentQuantity < item.quantity) {
                    throw new Error(`Estoque insuficiente para ${productDoc.data().name}.`);
                }

                transaction.update(productRef, { quantity: increment(-item.quantity) });

                const movementData: Omit<Movement, 'id'> = {
                    productId: item.id,
                    date: exitData.date,
                    type: 'Saída',
                    quantity: item.quantity,
                    responsible: exitData.responsible,
                    department: exitData.department,
                    productType: productDoc.data().type,
                };
                const movementRef = doc(collection(db, "movements"));
                transaction.set(movementRef, movementData);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const finalizeReturn = async (returnData: ReturnData): Promise<void> => {
     try {
        await runTransaction(db, async (transaction) => {
            for (const item of returnData.items) {
                const productRef = doc(db, "products", item.id);
                const productDoc = await transaction.get(productRef);
                 if (!productDoc.exists()) {
                    throw new Error(`Produto com ID ${item.id} não encontrado.`);
                }

                transaction.update(productRef, { quantity: increment(item.quantity) });

                const movementData: Omit<Movement, 'id'> = {
                    productId: item.id,
                    date: returnData.date,
                    type: 'Devolução',
                    quantity: item.quantity,
                    responsible: returnData.responsible,
                    department: returnData.department,
                    productType: productDoc.data().type,
                };
                const movementRef = doc(collection(db, "movements"));
                transaction.set(movementRef, movementData);
            }
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e;
    }
};

export const getMovements = async (filters: MovementFilters = {}): Promise<Movement[]> => {
    const { startDate, endDate, movementType, materialType, department } = filters;
    const movementsCollection = collection(db, 'movements');
    let constraints: QueryConstraint[] = [];

    if (startDate) { constraints.push(where('date', '>=', startDate)); }
    if (endDate) {
        const toDate = new Date(parseISO(endDate));
        toDate.setHours(23, 59, 59, 999);
        constraints.push(where('date', '<=', toDate.toISOString()));
    }
    if (movementType && movementType !== 'all') { constraints.push(where('type', '==', movementType)); }
    if (department && department !== 'all') { constraints.push(where('department', '==', department)); }
    
    if (materialType && materialType !== 'all') {
        constraints.push(where('productType', '==', materialType));
    }
    
    constraints.push(orderBy('date', 'desc'));

    const finalQuery = query(movementsCollection, ...constraints);
    const snapshot = await getDocs(finalQuery);

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
};

export const getMovementsForItem = async (productId: string): Promise<Movement[]> => {
    const q = query(movementsCollection, where('productId', '==', productId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
}

export const addMovement = async (movementData: Omit<Movement, 'id'>): Promise<string> => {
    const docRef = await addDoc(movementsCollection, movementData);
    return docRef.id;
};

export interface User {
  uid: string;
  email: string;
  role: 'Admin' | 'Operator';
}

// NOVA VERSÃO - Busca utilizadores diretamente do Firestore
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...(doc.data() as { email: string; role: 'Admin' | 'Operator' })
    }));
    return userList;
  } catch (error) {
    console.error("Erro ao buscar utilizadores:", error);
    throw new Error("Não foi possível buscar os utilizadores.");
  }
};

// NOVA VERSÃO - Atualiza a role diretamente no Firestore
export const updateUserRole = async (uid: string, role: 'Admin' | 'Operator'): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { role: role });
  } catch (error) {
    console.error("Erro ao atualizar a role do utilizador:", error);
    throw new Error("Não foi possível atualizar a role do utilizador.");
  }
};
