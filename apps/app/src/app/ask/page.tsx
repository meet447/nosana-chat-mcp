import { Metadata } from "next";
import AskPageClient from "./AskPageClient";

export const metadata: Metadata = {
  title: "Nosana Chat | Ask",
  description: "Ask anything to Nosana Chat",
};

export default function Page() {
  return <AskPageClient />;
}
