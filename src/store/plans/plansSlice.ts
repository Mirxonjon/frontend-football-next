import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED_PRICE";

export type PlanFeature = {
  uz: string;
  ru: string;
  highlight?: boolean;
};

export type SubscriptionPlan = {
  id: number;
  titleUz: string;
  titleRu: string;
  descriptionUz: string;
  descriptionRu: string;
  durationDays: number;
  discountType: DiscountType;
  basePrice: number;
  discountPercent: number;
  fixedDiscountPrice: number | null;
  isActive: boolean;
  features: PlanFeature[];
  createdAt: string;
  updatedAt: string;
};

type PlansState = {
  list: SubscriptionPlan[];
  loading: boolean;
  error: string;
  current: SubscriptionPlan | null;
  currentLoading: boolean;
  currentError: string;
};

const initialState: PlansState = {
  list: [],
  loading: false,
  error: "",
  current: null,
  currentLoading: false,
  currentError: "",
};

const normalizePlan = (raw: any): SubscriptionPlan => ({
  ...raw,
  features: Array.isArray(raw?.features)
    ? raw.features
        .filter((f: any) => f && (f.uz || f.ru))
        .map((f: any) => ({
          uz: String(f.uz ?? ""),
          ru: String(f.ru ?? f.uz ?? ""),
          highlight: Boolean(f.highlight),
        }))
    : [],
});

export const fetchPlans = createAsyncThunk<
  SubscriptionPlan[],
  void,
  { rejectValue: string }
>("plans/list", async (_, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: SubscriptionPlan[];
    }>("/plans");
    return (res.data?.data ?? []).map(normalizePlan);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load plans"
    );
  }
});

export const fetchPlanById = createAsyncThunk<
  SubscriptionPlan,
  number,
  { rejectValue: string }
>("plans/getById", async (id, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: SubscriptionPlan;
    }>(`/plans/${id}`);
    return normalizePlan(res.data.data);
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load plan"
    );
  }
});

const plansSlice = createSlice({
  name: "plans",
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.currentError = "";
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchPlans.pending, (s) => {
      s.loading = true;
      s.error = "";
    });
    b.addCase(fetchPlans.fulfilled, (s, a) => {
      s.loading = false;
      s.list = a.payload;
    });
    b.addCase(fetchPlans.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || "Failed to load plans";
    });

    b.addCase(fetchPlanById.pending, (s) => {
      s.currentLoading = true;
      s.currentError = "";
    });
    b.addCase(fetchPlanById.fulfilled, (s, a) => {
      s.currentLoading = false;
      s.current = a.payload;
    });
    b.addCase(fetchPlanById.rejected, (s, a) => {
      s.currentLoading = false;
      s.currentError = a.payload || "Failed to load plan";
    });
  },
});

export const plansActions = plansSlice.actions;
export const plansReducer = plansSlice.reducer;

// ─── Helpers ──────────────────────────────────────────────────────────

export function calcFinalPrice(p: SubscriptionPlan): number {
  if (!p || p.basePrice <= 0) return 0;
  switch (p.discountType) {
    case "PERCENTAGE":
      return Math.max(
        0,
        Math.round(p.basePrice * (1 - p.discountPercent / 100))
      );
    case "FIXED_PRICE":
      return p.fixedDiscountPrice ?? p.basePrice;
    default:
      return p.basePrice;
  }
}

export function planHasDiscount(p: SubscriptionPlan): boolean {
  return p.discountType !== "NONE" && calcFinalPrice(p) < p.basePrice;
}

export function discountPercentValue(p: SubscriptionPlan): number {
  if (p.basePrice <= 0) return 0;
  const final = calcFinalPrice(p);
  if (final >= p.basePrice) return 0;
  return Math.round(((p.basePrice - final) / p.basePrice) * 100);
}

export function planTitle(
  p: SubscriptionPlan,
  locale: "uz" | "ru" | "en"
): string {
  return locale === "ru" ? p.titleRu : p.titleUz;
}

export function planDescription(
  p: SubscriptionPlan,
  locale: "uz" | "ru" | "en"
): string {
  return locale === "ru" ? p.descriptionRu : p.descriptionUz;
}

/** Return localized text for a single feature. English falls back to UZ. */
export function featureText(
  f: PlanFeature,
  locale: "uz" | "ru" | "en"
): string {
  if (locale === "ru") return f.ru || f.uz || "";
  return f.uz || f.ru || "";
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 })
    .format(Math.max(0, Math.round(amount)))
    .replace(/,/g, " ");
}

export function durationLabel(
  days: number,
  locale: "uz" | "ru" | "en"
): string {
  if (days % 365 === 0) {
    const y = days / 365;
    if (locale === "ru") return `${y} ${y === 1 ? "год" : "год(а)"}`;
    if (locale === "en") return `${y} ${y === 1 ? "year" : "years"}`;
    return `${y} yil`;
  }
  if (days % 30 === 0) {
    const m = days / 30;
    if (locale === "ru") return `${m} мес.`;
    if (locale === "en") return `${m} ${m === 1 ? "month" : "months"}`;
    return `${m} oy`;
  }
  if (days % 7 === 0) {
    const w = days / 7;
    if (locale === "ru") return `${w} нед.`;
    if (locale === "en") return `${w} ${w === 1 ? "week" : "weeks"}`;
    return `${w} hafta`;
  }
  if (locale === "ru") return `${days} дн.`;
  if (locale === "en") return `${days} ${days === 1 ? "day" : "days"}`;
  return `${days} kun`;
}
