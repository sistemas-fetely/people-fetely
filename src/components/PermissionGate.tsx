import { usePermissions } from "@/hooks/usePermissions";
import type { ReactNode } from "react";

interface PermissionGateProps {
  module: string;
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ module, permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(module, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
