import { Metadata } from "next";
import ChatPageClient from "./ChatPageClient";

export const metadata: Metadata = {
    title: "Nosana Chat | Conversation",
    description: "Chat history and active conversation",
};

export default function Page() {
    return <ChatPageClient />;
}
