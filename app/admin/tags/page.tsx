import { redirect } from "next/navigation";

export default async function TagsPage() {
  redirect("/admin/categories");
}
