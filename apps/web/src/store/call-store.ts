"use client";

import type { CallDetails, CallListResponse, CallStatus } from "@ai-agent-platform/types";
import { create } from "zustand";

interface CallState {
  calls: CallListResponse | null;
  selectedCall: CallDetails | null;
  page: number;
  limit: number;
  search: string;
  status: CallStatus | "ALL";
  loading: boolean;
  setCalls: (calls: CallListResponse | null) => void;
  setSelectedCall: (call: CallDetails | null) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: CallStatus | "ALL") => void;
  setLoading: (loading: boolean) => void;
}

export const useCallStore = create<CallState>((set) => ({
  calls: null,
  selectedCall: null,
  page: 1,
  limit: 20,
  search: "",
  status: "ALL",
  loading: false,
  setCalls: (calls) => set({ calls }),
  setSelectedCall: (selectedCall) => set({ selectedCall }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setLoading: (loading) => set({ loading }),
}));
