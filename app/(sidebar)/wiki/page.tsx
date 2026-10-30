import { permanentRedirect } from "next/navigation";

export default function RetiredSection() {
  permanentRedirect("/posts");
}
