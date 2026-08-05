import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Municipality, CRMInteraction } from '../types';
import { MOCK_MUNICIPALITIES, MOCK_CRM_INTERACTIONS } from '../data/mockData';

const MUNICIPALITIES_COLLECTION = 'municipalities';
const INTERACTIONS_COLLECTION = 'crm_interactions';
const FIELD_VISITS_COLLECTION = 'field_visits';

/**
 * Initializes Firebase database with mock data if collections are empty,
 * and sets up real-time listeners for updates.
 */
export function subscribeToMunicipalities(
  onUpdate: (data: Municipality[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, MUNICIPALITIES_COLLECTION);

  // First check if collection is empty, if so, seed default municipalities
  getDocs(colRef).then((snapshot) => {
    if (snapshot.empty) {
      console.log('Seeding initial municipalities to Firebase Cloud...');
      MOCK_MUNICIPALITIES.forEach((m) => {
        setDoc(doc(db, MUNICIPALITIES_COLLECTION, m.id), m).catch(console.error);
      });
    }
  }).catch((err) => {
    console.error('Error checking municipalities collection:', err);
  });

  // Subscribe to real-time updates
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const uniqueMap = new Map<string, Municipality>();
        const nameStateSet = new Set<string>();

        snapshot.docs.forEach((d) => {
          const m = d.data() as Municipality;
          if (m && m.id && m.name && m.state) {
            const nameKey = `${m.name.trim().toLowerCase()}-${m.state.trim().toLowerCase()}`;
            if (!uniqueMap.has(m.id) && !nameStateSet.has(nameKey)) {
              uniqueMap.set(m.id, m);
              nameStateSet.add(nameKey);
            }
          }
        });

        const list = Array.from(uniqueMap.values());
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Firestore municipalities listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToInteractions(
  onUpdate: (data: CRMInteraction[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, INTERACTIONS_COLLECTION);

  getDocs(colRef).then((snapshot) => {
    if (snapshot.empty) {
      console.log('Seeding initial CRM interactions to Firebase Cloud...');
      MOCK_CRM_INTERACTIONS.forEach((item) => {
        setDoc(doc(db, INTERACTIONS_COLLECTION, item.id), item).catch(console.error);
      });
    }
  }).catch((err) => {
    console.error('Error checking interactions collection:', err);
  });

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const uniqueMap = new Map<string, CRMInteraction>();
        snapshot.docs.forEach((d) => {
          const item = d.data() as CRMInteraction;
          if (item && item.id) {
            uniqueMap.set(item.id, item);
          }
        });
        const list = Array.from(uniqueMap.values());
        // Sort newest first
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        onUpdate(list);
      }
    },
    (err) => {
      console.error('Firestore interactions listener error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save or update a municipality in Firebase
 */
export async function saveMunicipalityToFirebase(m: Municipality): Promise<void> {
  try {
    const docRef = doc(db, MUNICIPALITIES_COLLECTION, m.id);
    await setDoc(docRef, m, { merge: true });
  } catch (err) {
    console.error('Failed to save municipality to Firebase:', err);
  }
}

/**
 * Add or update a CRM interaction in Firebase
 */
export async function saveInteractionToFirebase(interaction: CRMInteraction): Promise<void> {
  try {
    const docRef = doc(db, INTERACTIONS_COLLECTION, interaction.id);
    await setDoc(docRef, interaction, { merge: true });
  } catch (err) {
    console.error('Failed to save interaction to Firebase:', err);
  }
}

/**
 * Record a field checkin/visit in Firebase
 */
export async function saveFieldCheckinToFirebase(checkinData: {
  municipalityId: string;
  municipalityName: string;
  timestamp: string;
  location: string;
  contactMet?: string;
  notes?: string;
}): Promise<void> {
  try {
    const colRef = collection(db, FIELD_VISITS_COLLECTION);
    await addDoc(colRef, checkinData);
  } catch (err) {
    console.error('Failed to save field checkin to Firebase:', err);
  }
}
