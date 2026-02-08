import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // GCP環境ではADCが自動で利用される
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: cert(
        process.env.GOOGLE_APPLICATION_CREDENTIALS as unknown as ServiceAccount
      ),
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
    });
  }

  // Cloud Run等ではデフォルト認証情報を使用
  return initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

const adminApp = getAdminApp();
const adminDb = getFirestore(adminApp);

export { adminDb };
