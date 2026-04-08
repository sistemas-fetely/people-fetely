import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganograma } from "@/hooks/useOrganograma";
import { OrgToolbar } from "@/components/organograma/OrgToolbar";
import { OrgVisualView } from "@/components/organograma/OrgVisualView";
import { OrgSyntheticView } from "@/components/organograma/OrgSyntheticView";
import { OrgAnalyticView } from "@/components/organograma/OrgAnalyticView";
import { OrgNodeDrawer } from "@/components/organograma/OrgNodeDrawer";
import type { ViewMode, OrgFilters, PosicaoNode } from "@/types/organograma";

function filterTree(nodes: PosicaoNode[], filters: OrgFilters): PosicaoNode[] {
  function matchNode(n: PosicaoNode): boolean {
    if (filters.departamento !== "todos" && n.departamento !== filters.departamento) return false;
    if (filters.filial !== "todos" && n.filial !== filters.filial) return false;
    if (filters.vinculo !== "todos" && n.vinculo !== filters.vinculo) return false;
    if (filters.status !== "todos" && n.status !== filters.status) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const match = n.nome_display.toLowerCase().includes(s) || n.titulo_cargo.toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  }

  function filterNode(node: PosicaoNode): PosicaoNode | null {
    const filteredChildren = node.children.map(filterNode).filter(Boolean) as PosicaoNode[];
    if (matchNode(node) || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  }

  return nodes.map(filterNode).filter(Boolean) as PosicaoNode[];
}

function flattenFiltered(nodes: PosicaoNode[]): PosicaoNode[] {
  const result: PosicaoNode[] = [];
  function walk(n: PosicaoNode) { result.push(n); n.children.forEach(walk); }
  nodes.forEach(walk);
  return result;
}

export default function Organograma() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = (searchParams.get("view") as ViewMode) || "visual";
  const { data, isLoading } = useOrganograma();

  const [filters, setFilters] = useState<OrgFilters>({
    search: searchParams.get("search") || "",
    departamento: searchParams.get("dept") || "todos",
    filial: searchParams.get("filial") || "todos",
    vinculo: searchParams.get("vinculo") || "todos",
    status: searchParams.get("status") || "todos",
    nivel: "todos",
  });

  const [selectedNode, setSelectedNode] = useState<PosicaoNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const setViewMode = (v: ViewMode) => {
    setSearchParams(prev => { prev.set("view", v); return prev; });
  };

  const handleNodeClick = useCallback((node: PosicaoNode) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  }, []);

  const filteredTree = useMemo(() => {
    if (!data) return [];
    const hasFilter = filters.search || filters.departamento !== "todos" || filters.filial !== "todos" || filters.vinculo !== "todos" || filters.status !== "todos";
    if (!hasFilter) return data.tree;
    return filterTree(data.tree, filters);
  }, [data, filters]);

  const filteredFlat = useMemo(() => flattenFiltered(filteredTree), [filteredTree]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <OrgToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filters={filters}
        onFiltersChange={setFilters}
        allNodes={data?.flat || []}
      />

      {viewMode === "visual" && (
        <OrgVisualView tree={filteredTree} filters={filters} onNodeClick={handleNodeClick} />
      )}
      {viewMode === "sintetico" && (
        <OrgSyntheticView tree={filteredTree} flat={filteredFlat} filters={filters} onNodeClick={handleNodeClick} />
      )}
      {viewMode === "analitico" && (
        <OrgAnalyticView flat={filteredFlat} filters={filters} />
      )}

      <OrgNodeDrawer
        node={selectedNode}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        allNodes={data?.flat || []}
      />
    </div>
  );
}
