import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

export const addDocument = async (collName: string, data: any) => {
  return await addDoc(collection(db, collName), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const updateDocument = async (collName: string, id: string, data: any) => {
  const docRef = doc(db, collName, id);
  return await updateDoc(docRef, data);
};

export const deleteDocument = async (collName: string, id: string) => {
  const docRef = doc(db, collName, id);
  return await deleteDoc(docRef);
};

export const getDocuments = async (collName: string) => {
  const q = query(collection(db, collName), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
