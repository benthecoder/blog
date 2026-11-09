import { redirect } from "next/navigation";
import { SYLLABUS_PATH } from "@/config/syllabus";

export default function SchoolAliasPage() {
  redirect(SYLLABUS_PATH);
}
