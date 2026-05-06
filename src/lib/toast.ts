import {
  dispatchToast,
  dismissToast,
  type ToastOptions,
} from "@/components/kronos/KronosToaster";

/**
 * Kronos toast helpers — custom event-based, framework-free.
 * Use these instead of alert() / silent feedback.
 */
export const kToast = {
  success(title: string, opts?: ToastOptions) {
    return dispatchToast({ variant: "success", title, options: opts });
  },
  error(title: string, opts?: ToastOptions) {
    return dispatchToast({ variant: "error", title, options: opts });
  },
  info(title: string, opts?: ToastOptions) {
    return dispatchToast({ variant: "info", title, options: opts });
  },
  warning(title: string, opts?: ToastOptions) {
    return dispatchToast({ variant: "warning", title, options: opts });
  },
  loading(title: string, opts?: ToastOptions) {
    return dispatchToast({
      variant: "loading",
      title,
      options: { ...opts, duration: opts?.duration ?? 0 },
    });
  },
  dismiss(id?: string) {
    dismissToast(id);
  },
};
