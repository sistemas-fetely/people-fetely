import { useEffect, useState } from "react";
import { useMinhasUnidades } from "./useMinhasUnidades";

const STORAGE_KEY = "fetely_unidade_ativa";

export function useUnidadeAtiva() {
  const { data: unidades, isLoading } = useMinhasUnidades();
  const [unidadeId, setUnidadeIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // Valida contra lista de unidades permitidas
  useEffect(() => {
    if (isLoading || !unidades) return;

    if (unidadeId && !unidades.find((u) => u.unidade_id === unidadeId)) {
      setUnidadeIdState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [unidades, isLoading, unidadeId]);

  function setUnidadeId(id: string | null) {
    setUnidadeIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const unidadeAtiva = unidadeId ? unidades?.find((u) => u.unidade_id === unidadeId) : null;

  return {
    unidadeId,
    unidadeAtiva,
    unidades: unidades || [],
    setUnidadeId,
    isLoading,
  };
}
