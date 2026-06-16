import BookAiChatPage from "@/pages-legacy/BookAiChatPage/BookAiChatPage";

export const metadata = {
  title: "AI bilan suhbat",
  description: "Kitob bo'yicha AI yordamchi bilan suhbat.",
  robots: { index: false, follow: false }, // private, per-user chat
};

export default function Page() {
  return <BookAiChatPage />;
}
