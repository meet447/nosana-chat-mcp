import { ChatDB } from "@/lib/db";
import * as Comlink from "comlink";

const db = ChatDB.getInstance();

Comlink.expose(db);
