"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  ConfirmDialog,
  type ConfirmOptions,
} from "@/components/ui/ConfirmDialog";

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions | null;
    resolve: ((v: boolean) => void) | null;
  }>({ open: false, options: null, resolve: null });

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleClose = useCallback(
    (value: boolean) => {
      state.resolve?.(value);
      setState({ open: false, options: null, resolve: null });
    },
    [state],
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={state.open}
        options={state.options}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Next.js RSC: durante el SSR de un client component que vive dentro
    // de un server component, el contexto del ConfirmProvider (que vive en
    // RootLayout) no propaga. Devolvemos un no-op para no romper el render
    // del server — al hidratar en cliente, el contexto real toma control.
    if (typeof window === "undefined") {
      return async () => false;
    }
    throw new Error("useConfirm must be used inside ConfirmProvider");
  }
  return ctx;
}
