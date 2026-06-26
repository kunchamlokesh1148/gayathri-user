import { auth, db, isFirebaseActive } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  serverTimestamp 
} from 'firebase/firestore';
import { saveUserProfile, getUserProfile, checkMobileExists, checkEmailExists } from './db';

export const onAuthStateChange = (callback) => {
  if (isFirebaseActive) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          callback(profile ? { uid: firebaseUser.uid, ...profile } : { uid: firebaseUser.uid, email: firebaseUser.email || "" });
        } catch (error) {
          console.error("Auth state fetch failed", error);
          callback({ uid: firebaseUser.uid });
        }
      } else {
        callback(null);
      }
    });
  } else {
    setTimeout(() => {
      callback(null);
    }, 50);
    return () => {};
  }
};

export const logoutUser = async () => {
  if (isFirebaseActive) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase Signout Error:", e);
    }
  }
  localStorage.removeItem('wh_session');
};

export const loginWithEmailAndPassword = async (email, password) => {
  if (isFirebaseActive) {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const uid = userCredential.user.uid;
    let profile = await getUserProfile(uid);
    if (!profile) {
      profile = {
        email: userCredential.user.email || email.trim().toLowerCase(),
        ownerName: userCredential.user.displayName || email.split('@')[0] || "Shop Owner",
        mobile: "0000000000",
        address: "Set your Address",
        role: "customer",
        status: "active",
        createdAt: serverTimestamp()
      };
      await saveUserProfile(uid, profile);
      profile = await getUserProfile(uid);
    }
    return { uid, ...profile };
  }
  throw new Error("Firebase not active.");
};

export const registerCustomer = async (formData) => {
  if (isFirebaseActive) {
    const { email, password, ownerName, mobile, address, shopName } = formData;
    
    // Check mobile uniqueness in Firestore
    const mobileExists = await checkMobileExists(mobile);
    if (mobileExists) {
      throw new Error("An account with this mobile number already exists. Please sign in.");
    }

    // Check email uniqueness in Firestore
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      throw new Error("An account with this email address already exists. Please sign in.");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const uid = userCredential.user.uid;
    
    const cleanMobile = mobile.trim();
    const formattedMobile = cleanMobile.startsWith('+91') ? cleanMobile : `+91${cleanMobile}`;

    const profile = {
      email: email.trim().toLowerCase(),
      ownerName: ownerName.trim(),
      mobile: formattedMobile,
      address: address.trim(),
      deliveryAddress: formData.deliveryAddress || null,
      role: "customer",
      status: "active",
      createdAt: serverTimestamp()
    };

    if (shopName && shopName.trim() !== '') {
      profile.shopName = shopName.trim();
    }

    await saveUserProfile(uid, profile);
    return { uid, ...profile };
  }
  throw new Error("Firebase not active.");
};
