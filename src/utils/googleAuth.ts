const GOOGLE_SCRIPT_ID = "google-identity-script";

const loadGoogleScript = (): Promise<void> => {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (document.getElementById(GOOGLE_SCRIPT_ID)) {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
      if (!existing) {
        reject(new Error("Google script not found"));
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed"));
    document.head.appendChild(script);
  });
};

export const getGoogleIdToken = async (clientId: string): Promise<string> => {
  if (!clientId) throw new Error("Thiếu Google Client ID");
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const google = window.google;
    if (!google?.accounts?.id) {
      reject(new Error("Google Identity Services chưa sẵn sàng"));
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Google xác thực quá thời gian (60s)"));
      }
    }, 60000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      settled = true;
    };

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (settled) return;
        cleanup();
        if (!response?.credential) {
          reject(new Error("Không nhận được Google credential"));
          return;
        }
        resolve(response.credential);
      },
      use_fedcm_for_prompt: true,
    });

    // Use prompt with error handling
    let notificationHandled = false;
    google.accounts.id.prompt((notification: any) => {
      if (settled || notificationHandled) return;
      notificationHandled = true;

      if (notification?.isNotDisplayed?.()) {
        cleanup();
        console.warn("[Google Auth] Prompt not displayed. This may happen if:");
        console.warn("  - Origin not whitelisted in Google Cloud Console");
        console.warn("  - User dismissed all One Tap prompts recently");
        console.warn("  - Browser privacy settings blocking");
        reject(new Error(
          "Google prompt không hiển thị. Kiểm tra origin trong Google Cloud Console."
        ));
      } else if (notification?.isSkippedMoment?.()) {
        cleanup();
        console.warn("[Google Auth] Prompt skipped by user");
        reject(new Error("Bạn đã bỏ qua Google login"));
      }
    });
  });
};
