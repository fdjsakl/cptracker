import { useState, useEffect, useCallback } from "react";
import {
  getAllProblems,
  addProblems as dbAddProblems,
  updateProblem as dbUpdateProblem,
  deleteProblem as dbDeleteProblem,
  deleteAllProblems,
  importProblems as dbImportProblems,
} from "@/lib/db";
import { mockProblems, type SolvedProblem } from "@/data/mock";

export function useProblemsDB() {
  const [problems, setProblems] = useState<SolvedProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 仅加载数据，不自动初始化
  const refreshProblems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllProblems();
      setProblems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载数据失败");
      setProblems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 首次加载时，如果数据库为空则初始化 mock 数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAllProblems();

        if (data.length === 0) {
          await dbImportProblems(mockProblems, true);
          const newData = await getAllProblems();
          setProblems(newData);
        } else {
          setProblems(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载数据失败");
        setProblems([]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const addProblems = useCallback(
    async (newProblems: Omit<SolvedProblem, "id">[]) => {
      try {
        setError(null);
        await dbAddProblems(newProblems);
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "添加数据失败");
        return false;
      }
    },
    [refreshProblems]
  );

  const updateProblem = useCallback(
    async (id: number, changes: Partial<SolvedProblem>) => {
      try {
        setError(null);
        await dbUpdateProblem(id, changes);
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "更新数据失败");
        return false;
      }
    },
    [refreshProblems]
  );

  const deleteProblem = useCallback(
    async (id: number) => {
      try {
        setError(null);
        await dbDeleteProblem(id);
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "删除数据失败");
        return false;
      }
    },
    [refreshProblems]
  );

  const clearAllProblems = useCallback(async () => {
    try {
      setError(null);
      await deleteAllProblems();
      setProblems([]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空数据失败");
      return false;
    }
  }, []);

  const importProblems = useCallback(
    async (newProblems: Omit<SolvedProblem, "id">[], clearExisting = false) => {
      try {
        setError(null);
        await dbImportProblems(newProblems, clearExisting);
        await refreshProblems();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "导入数据失败");
        return false;
      }
    },
    [refreshProblems]
  );

  const resetToMockData = useCallback(async () => {
    try {
      setError(null);
      await dbImportProblems(mockProblems, true);
      await refreshProblems();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置数据失败");
      return false;
    }
  }, [refreshProblems]);

  return {
    problems,
    isLoading,
    error,
    addProblems,
    updateProblem,
    deleteProblem,
    clearAllProblems,
    importProblems,
    resetToMockData,
    refresh: refreshProblems,
  };
}
