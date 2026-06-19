import { Firestore } from '@google-cloud/firestore';
import { createServerFn } from "@tanstack/react-start";
import type { CarbonInputs, CarbonCategoryBreakdown } from "./carbon-tracker";

// Initialize Firestore
// In Cloud Run, it automatically picks up the default service account and project ID
// Locally, you must run `gcloud auth application-default login`
const db = new Firestore();

export const syncHistoryToCloud = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: any }) => {
    const { userId, totalKg, inputs, breakdown, grade, timestamp } = data as {
      userId: string;
      totalKg: number;
      inputs: CarbonInputs;
      breakdown: CarbonCategoryBreakdown;
      grade: string;
      timestamp: string;
    };

    try {
      // Save footprint to the 'user_history' collection under the user's UUID
      // and append to a 'footprints' subcollection for historical tracking over time.
      const userRef = db.collection('user_history').doc(userId);
      const footprintRef = userRef.collection('footprints').doc(timestamp);

      // Create or update the root user document
      await userRef.set({
        lastUpdated: timestamp,
        latestGrade: grade,
        latestTotalKg: totalKg,
      }, { merge: true });

      // Save this specific calculation entry
      await footprintRef.set({
        totalKg,
        grade,
        inputs,
        breakdown,
        timestamp,
      });

      console.log(`Successfully synced footprint for ${userId}`);
      return { success: true };
    } catch (error) {
      console.error("Firestore sync failed:", error);
      return { success: false, error: "Database sync failed" };
    }
  });
