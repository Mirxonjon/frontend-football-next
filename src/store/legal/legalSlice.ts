import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import FT_API from "../../api/api";

export type LegalDocumentType =
  | "PRIVACY_POLICY"
  | "TERMS_OF_SERVICE"
  | "OFFER_AGREEMENT"
  | "REQUISITES";

export type LegalDocument = {
  id: number;
  type: LegalDocumentType;
  version: number;
  titleUz: string;
  titleRu: string;
  contentUz: string;
  contentRu: string;
  isActive: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
};

type LegalState = {
  list: LegalDocument[];
  listLoading: boolean;
  listError: string;
  byType: Partial<Record<LegalDocumentType, LegalDocument>>;
  currentLoading: boolean;
  currentError: string;
};

const initialState: LegalState = {
  list: [],
  listLoading: false,
  listError: "",
  byType: {},
  currentLoading: false,
  currentError: "",
};

export const fetchLegalDocuments = createAsyncThunk<
  LegalDocument[],
  void,
  { rejectValue: string }
>("legal/list", async (_, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: LegalDocument[];
    }>("/legal/documents");
    return res.data?.data ?? [];
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load legal documents"
    );
  }
});

export const fetchLegalDocumentByType = createAsyncThunk<
  LegalDocument,
  LegalDocumentType,
  { rejectValue: string }
>("legal/getByType", async (type, { rejectWithValue }) => {
  try {
    const res = await FT_API.get<{
      status_code: number;
      data: LegalDocument;
    }>(`/legal/documents/${type}`);
    return res.data.data;
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load legal document"
    );
  }
});

const legalSlice = createSlice({
  name: "legal",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchLegalDocuments.pending, (s) => {
      s.listLoading = true;
      s.listError = "";
    });
    b.addCase(fetchLegalDocuments.fulfilled, (s, a) => {
      s.listLoading = false;
      s.list = a.payload;
      // Cache each by type for instant page renders.
      for (const d of a.payload) s.byType[d.type] = d;
    });
    b.addCase(fetchLegalDocuments.rejected, (s, a) => {
      s.listLoading = false;
      s.listError = a.payload || "Failed to load legal documents";
    });

    b.addCase(fetchLegalDocumentByType.pending, (s) => {
      s.currentLoading = true;
      s.currentError = "";
    });
    b.addCase(fetchLegalDocumentByType.fulfilled, (s, a) => {
      s.currentLoading = false;
      s.byType[a.payload.type] = a.payload;
    });
    b.addCase(fetchLegalDocumentByType.rejected, (s, a) => {
      s.currentLoading = false;
      s.currentError = a.payload || "Failed to load legal document";
    });
  },
});

export const legalReducer = legalSlice.reducer;

// ─── Helpers ──────────────────────────────────────────────────────

export const TYPE_ORDER: LegalDocumentType[] = [
  "PRIVACY_POLICY",
  "TERMS_OF_SERVICE",
  "OFFER_AGREEMENT",
  "REQUISITES",
];

export const LEGAL_TYPE_LABEL: Record<
  LegalDocumentType,
  { uz: string; ru: string; en: string }
> = {
  PRIVACY_POLICY: {
    uz: "Maxfiylik siyosati",
    ru: "Политика конфиденциальности",
    en: "Privacy Policy",
  },
  TERMS_OF_SERVICE: {
    uz: "Foydalanuvchi shartnomasi",
    ru: "Пользовательское соглашение",
    en: "Terms of Service",
  },
  OFFER_AGREEMENT: {
    uz: "Ommaviy oferta",
    ru: "Договор оферты",
    en: "Offer Agreement",
  },
  REQUISITES: {
    uz: "Rekvizitlar",
    ru: "Реквизиты",
    en: "Requisites",
  },
};

export function legalTitle(
  d: LegalDocument,
  locale: "uz" | "ru" | "en"
): string {
  if (locale === "ru") return d.titleRu || d.titleUz;
  return d.titleUz || d.titleRu;
}

export function legalContent(
  d: LegalDocument,
  locale: "uz" | "ru" | "en"
): string {
  if (locale === "ru") return d.contentRu || d.contentUz;
  return d.contentUz || d.contentRu;
}

/** True if `s` looks like a URL slug for a known legal type. */
export function parseTypeFromSlug(slug: string): LegalDocumentType | null {
  const upper = slug.toUpperCase().replace(/-/g, "_");
  if ((TYPE_ORDER as string[]).includes(upper)) {
    return upper as LegalDocumentType;
  }
  return null;
}

export function typeToSlug(type: LegalDocumentType): string {
  return type.toLowerCase();
}
