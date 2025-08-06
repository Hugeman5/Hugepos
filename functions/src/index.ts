import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Define the expected request shape
interface RequestData {
  pin: string;
}

export const verifyPin = functions.https.onCall(
  async (request: functions.https.CallableRequest<RequestData>) => {
    const { pin } = request.data;

    if (!pin) {
      throw new functions.https.HttpsError("invalid-argument", "PIN is required.");
    }

    try {
      const usersRef = db.collection("users");
      const querySnapshot = await usersRef
        .where("pin", "==", pin)
        .where("active", "==", true)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        throw new functions.https.HttpsError("not-found", "Invalid or inactive PIN.");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      return {
        uid: userDoc.id,
        name: userData.name,
        role: userData.role,
        locationId: userData.locationId || null,
      };
    } catch (error) {
      console.error("Error verifying PIN:", error);
      throw new functions.https.HttpsError("internal", "Could not verify PIN.");
    }
  }
);