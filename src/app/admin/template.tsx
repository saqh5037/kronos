import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const AdminTransition = dynamic(() => import("./_components/AdminTransition"));

export default function AdminTemplate({ children }: { children: ReactNode }) {
  return <AdminTransition>{children}</AdminTransition>;
}
